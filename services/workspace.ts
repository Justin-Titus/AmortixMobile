import { supabase } from '@/lib/supabase';
import { uuidv4 } from '@/lib/utils';

export type WorkspaceRecord = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMemberRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export type WorkspaceInviteRecord = {
  id: string;
  workspaceId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
};

/**
 * Fetch all workspaces the current user belongs to.
 */
export async function getUserWorkspaces(): Promise<{ workspaceId: string; workspace: WorkspaceRecord }[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from('WorkspaceMember')
    .select('workspaceId, workspace:Workspace(*)')
    .eq('userId', user.id);

  if (error) {
    console.error('Failed to fetch user workspaces:', error);
    throw new Error(`Failed to fetch workspaces: ${error.message}`);
  }

  // Filter out any entries where workspace details couldn't be loaded
  return (data as any[] ?? [])
    .filter(item => item.workspace)
    .map(item => ({
      workspaceId: item.workspaceId,
      workspace: item.workspace as WorkspaceRecord
    }));
}

/**
 * Fetch details of a specific workspace, including its members.
 */
export async function getWorkspaceDetails(workspaceId: string): Promise<{
  workspace: WorkspaceRecord;
  members: WorkspaceMemberRecord[];
}> {
  // Fetch workspace details
  const { data: workspace, error: wsError } = await supabase
    .from('Workspace')
    .select('*')
    .eq('id', workspaceId)
    .single();

  if (wsError) {
    console.error(`Failed to fetch workspace ${workspaceId}:`, wsError);
    throw new Error(`Failed to fetch workspace: ${wsError.message}`);
  }

  // Fetch workspace members and join with User profile
  const { data: members, error: memError } = await supabase
    .from('WorkspaceMember')
    .select('*, user:User(id, name, email, image)')
    .eq('workspaceId', workspaceId);

  if (memError) {
    console.error(`Failed to fetch members for workspace ${workspaceId}:`, memError);
    throw new Error(`Failed to fetch members: ${memError.message}`);
  }

  return {
    workspace: workspace as WorkspaceRecord,
    members: (members as any[] ?? []) as WorkspaceMemberRecord[]
  };
}

/**
 * Fetch all pending invites for a specific workspace.
 */
export async function getWorkspaceInvites(workspaceId: string): Promise<WorkspaceInviteRecord[]> {
  const { data, error } = await supabase
    .from('WorkspaceInvite')
    .select('*')
    .eq('workspaceId', workspaceId)
    .eq('status', 'PENDING');

  if (error) {
    console.error(`Failed to fetch invites for workspace ${workspaceId}:`, error);
    throw new Error(`Failed to fetch invites: ${error.message}`);
  }

  return (data as WorkspaceInviteRecord[]) ?? [];
}

/**
 * Invite a new member to a workspace.
 */
export async function createWorkspaceInvite(
  workspaceId: string,
  email: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER'
): Promise<WorkspaceInviteRecord> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('You must be logged in to invite members.');

  // Check if target is already invited or a member of the workspace
  const cleanEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Delete any existing pending invites to this email to avoid duplicates
  await supabase
    .from('WorkspaceInvite')
    .delete()
    .eq('workspaceId', workspaceId)
    .eq('email', cleanEmail)
    .eq('status', 'PENDING');

  const { data, error } = await supabase
    .from('WorkspaceInvite')
    .insert({
      id: uuidv4(),
      workspaceId,
      email: cleanEmail,
      role,
      invitedBy: user.id,
      status: 'PENDING',
      createdAt: now,
      expiresAt
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create invite:', error);
    throw new Error(error.message);
  }

  return data as WorkspaceInviteRecord;
}

/**
 * Create a new workspace and add the creator as OWNER.
 */
export async function createWorkspace(name: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('You must be logged in to create a workspace.');

  // Check owned workspaces limit (max 3)
  const { count: ownedCount, error: ownedError } = await supabase
    .from('Workspace')
    .select('*', { count: 'exact', head: true })
    .eq('createdBy', user.id);

  if (ownedError) throw new Error(ownedError.message);
  if (ownedCount && ownedCount >= 3) {
    throw new Error('You can only create a maximum of 3 workspaces.');
  }

  // Check total joined workspaces limit (max 5)
  const { count: totalCount, error: totalError } = await supabase
    .from('WorkspaceMember')
    .select('*', { count: 'exact', head: true })
    .eq('userId', user.id);

  if (totalError) throw new Error(totalError.message);
  if (totalCount && totalCount >= 5) {
    throw new Error('You can only belong to a maximum of 5 workspaces in total.');
  }

  const wsId = uuidv4();
  const now = new Date().toISOString();

  // Insert the workspace record
  const { error: wsError } = await supabase
    .from('Workspace')
    .insert({
      id: wsId,
      name: name.trim(),
      createdBy: user.id,
      createdAt: now,
      updatedAt: now
    });

  if (wsError) {
    console.error('Failed to insert workspace:', wsError);
    throw new Error(`Failed to create workspace: ${wsError.message}`);
  }

  // Insert the creator as OWNER member
  const { error: memError } = await supabase
    .from('WorkspaceMember')
    .insert({
      id: uuidv4(),
      workspaceId: wsId,
      userId: user.id,
      role: 'OWNER',
      joinedAt: now
    });

  if (memError) {
    console.error('Failed to add creator to workspace members:', memError);
    // Cleanup workspace to prevent orphan data
    await supabase.from('Workspace').delete().eq('id', wsId);
    throw new Error(`Failed to initialize workspace members: ${memError.message}`);
  }

  return wsId;
}

/**
 * Delete a workspace. Only the OWNER can do this.
 */
export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('You must be logged in to delete a workspace.');

  const { error } = await supabase
    .from('Workspace')
    .delete()
    .eq('id', workspaceId);

  if (error) {
    console.error(`Failed to delete workspace ${workspaceId}:`, error);
    throw new Error(`Failed to delete workspace: ${error.message}`);
  }
}

