import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, RefreshControl, StyleSheet, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, FlatList
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, Radius } from '@/constants/theme';
import {
  getUserWorkspaces,
  getWorkspaceDetails,
  getWorkspaceInvites,
  createWorkspaceInvite,
  createWorkspace,
  deleteWorkspace,
  type WorkspaceRecord,
  type WorkspaceMemberRecord,
  type WorkspaceInviteRecord
} from '@/services/workspace';
import { Users, UserPlus, Shield, Mail, Plus, AlertCircle, Sparkles, CheckCircle2, Copy, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function WorkspaceScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workspaces, setWorkspaces] = useState<{ workspaceId: string; workspace: WorkspaceRecord }[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceRecord | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberRecord[]>([]);
  const [invites, setInvites] = useState<WorkspaceInviteRecord[]>([]);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // New Workspace Form State
  const [newWsName, setNewWsName] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);

  // User's own membership role in the active workspace
  const userRole = members.find(m => m.userId === user?.id)?.role;
  const canInvite = userRole === 'OWNER' || userRole === 'ADMIN';

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const userWorkspaces = await getUserWorkspaces();
      setWorkspaces(userWorkspaces);

      if (userWorkspaces.length > 0) {
        const primaryWs = userWorkspaces[0].workspace;
        setActiveWorkspace(primaryWs);

        const details = await getWorkspaceDetails(primaryWs.id);
        setMembers(details.members);

        const pendingInvites = await getWorkspaceInvites(primaryWs.id);
        setInvites(pendingInvites);
      } else {
        setActiveWorkspace(null);
        setMembers([]);
        setInvites([]);
      }
    } catch (error: any) {
      console.error('Failed to load workspace data:', error);
      Alert.alert('Error', error.message || 'Failed to load workspace data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleInvite = async () => {
    if (!activeWorkspace) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setInviting(true);
    try {
      const invite = await createWorkspaceInvite(activeWorkspace.id, email, inviteRole);
      const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://amortix.vercel.app';
      const link = `${baseUrl}/workspace/join?inviteId=${invite.id}`;
      setGeneratedLink(link);
      setInviteEmail('');
      
      // Reload invites list
      const pendingInvites = await getWorkspaceInvites(activeWorkspace.id);
      setInvites(pendingInvites);
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      Alert.alert('Invitation Failed', error.message || 'Could not send invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleCreateWorkspace = async () => {
    const name = newWsName.trim();
    if (!name) {
      Alert.alert('Workspace Name Required', 'Please enter a workspace name.');
      return;
    }

    setCreatingWs(true);
    try {
      await createWorkspace(name);
      Alert.alert('Workspace Created', `Successfully initialized '${name}' household workspace!`);
      setNewWsName('');
      loadData();
    } catch (error: any) {
      console.error('Failed to create workspace:', error);
      Alert.alert('Creation Failed', error.message || 'Failed to create workspace.');
    } finally {
      setCreatingWs(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspace) return;

    Alert.alert(
      'Delete Workspace',
      `Are you sure you want to permanently delete '${activeWorkspace.name}'? All member access will be revoked, and shared loans will become personal.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const storedId = await AsyncStorage.getItem('amortix_selected_workspace_id');
              if (storedId === activeWorkspace.id) {
                await AsyncStorage.removeItem('amortix_selected_workspace_id');
              }
              await deleteWorkspace(activeWorkspace.id);
              Alert.alert('Workspace Deleted', 'The workspace has been successfully deleted.');
              loadData();
            } catch (error: any) {
              console.error('Failed to delete workspace:', error);
              Alert.alert('Error', error.message || 'Failed to delete workspace.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER': return 'green';
      case 'ADMIN': return 'slate';
      case 'MEMBER': return 'slate';
      default: return 'slate';
    }
  };

  const renderRoleBadge = (role: string) => {
    const label = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    return <Badge text={label} variant={getRoleBadgeVariant(role)} />;
  };

  if (loading) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.badgeRow}>
            <Skeleton width={120} height={14} />
          </View>
          <Skeleton width={200} height={32} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width="100%" height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="80%" height={16} />
        </View>

        {/* Invite Member Skeleton Card */}
        <Card>
          <Skeleton width={150} height={20} style={{ marginBottom: Spacing.xs }} />
          <Skeleton width="100%" height={12} style={{ marginBottom: 4 }} />
          <Skeleton width="80%" height={12} style={{ marginBottom: Spacing.md }} />
          <Skeleton width="100%" height={44} borderRadius={Radius.card} style={{ marginBottom: Spacing.md }} />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Skeleton width={80} height={36} borderRadius={Radius.button} />
            <Skeleton width={80} height={36} borderRadius={Radius.button} />
          </View>
        </Card>

        {/* Members List Skeleton Card */}
        <Card>
          <Skeleton width={120} height={20} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width={180} height={12} style={{ marginBottom: Spacing.md }} />

          {[1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <View style={{ gap: 4 }}>
                  <Skeleton width={120} height={14} />
                  <Skeleton width={80} height={10} />
                </View>
              </View>
              <Skeleton width={60} height={20} borderRadius={10} />
            </View>
          ))}
        </Card>
      </ScrollView>
    );
  }

  // ─── EMPTY STATE: NO ACTIVE WORKSPACE ───────────────────
  if (!activeWorkspace) {
    return (
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.emerald} />}
      >
        <View style={s.header}>
          <View style={s.badgeRow}>
            <Sparkles size={12} color={Colors.emerald} />
            <Typography variant="xs" weight="medium" color="slate" style={s.badgeText}>
              FAMILY COLLABORATION
            </Typography>
          </View>
          <Typography variant="hero" weight="bold" color="navy" fontFamily="heading" style={s.title}>
            Workspace
          </Typography>
          <Typography variant="md" color="slate" style={s.desc}>
            Amortix allows you to manage household debt collaboratively with your partner or family members.
          </Typography>
        </View>

        <Card style={s.emptyCard}>
          <Users size={36} color={Colors.slate} style={{ marginBottom: Spacing.md }} />
          <Typography variant="h3" weight="bold" color="navy" style={{ marginBottom: Spacing.sm }}>
            Create your household workspace
          </Typography>
          <Typography variant="body" color="slate" align="center" style={{ marginBottom: Spacing.lg }}>
            Establish a shared space to coordinate payments, view joint metrics, and build payoff strategies together.
          </Typography>

          <View style={s.formGroup}>
            <TextInput
              style={s.input}
              placeholder="e.g. Smith Family Space"
              placeholderTextColor={Colors.slate}
              value={newWsName}
              onChangeText={setNewWsName}
            />
            <TouchableOpacity
              style={s.button}
              onPress={handleCreateWorkspace}
              disabled={creatingWs}
            >
              {creatingWs ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Plus size={16} color="white" />
                  <Typography weight="bold" color="white">Create Workspace</Typography>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    );
  }

  // ─── ACTIVE STATE: WORKSPACE CONSOLE ───────────────────
  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.emerald} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <View style={s.badgeRow}>
          <Sparkles size={12} color={Colors.emerald} />
          <Typography variant="xs" weight="medium" color="slate" style={s.badgeText}>
            FAMILY CONSOLE
          </Typography>
        </View>
        <Typography variant="hero" weight="bold" color="navy" fontFamily="heading" style={s.title} numberOfLines={1}>
          {activeWorkspace.name}
        </Typography>
        <Typography variant="md" color="slate" style={s.desc}>
          Manage your shared household space and review coordinate access controls.
        </Typography>
      </View>

      {/* Invite Form Card (Admins / Owners only) */}
      {canInvite ? (
        <Card>
          {generatedLink ? (
            <View style={{ gap: Spacing.md, paddingVertical: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <CheckCircle2 size={24} color={Colors.emerald} />
                <Typography variant="body" weight="bold" color="navy">
                  Invitation Link Generated!
                </Typography>
              </View>
              <Typography variant="caption" color="slate">
                Share this link with your family member so they can join the workspace.
              </Typography>
              
              <View style={s.linkCopyRow}>
                <View style={s.linkTextContainer}>
                  <Typography variant="caption" color="navy" numberOfLines={1} style={s.linkText}>
                    {generatedLink}
                  </Typography>
                </View>
                <TouchableOpacity
                  style={s.copyButton}
                  onPress={async () => {
                    await Clipboard.setStringAsync(generatedLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    Alert.alert('Copied', 'Invitation link copied to clipboard.');
                  }}
                >
                  {copied ? (
                    <Check size={18} color="white" />
                  ) : (
                    <Copy size={18} color="white" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setGeneratedLink(null)}
                style={s.resetLinkBtn}
              >
                <Typography variant="caption" weight="bold" color="emerald" align="center" style={{ textDecorationLine: 'underline' }}>
                  Create another invitation
                </Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Typography variant="h3" weight="bold" color="navy" style={{ marginBottom: Spacing.sm }}>
                Invite family member
              </Typography>
              <Typography variant="xs" color="slate" style={{ marginBottom: Spacing.md }}>
                Send an invitation to join this workspace. Users can view or edit details according to their assigned roles.
              </Typography>

              <View style={s.formGroup}>
                <View style={s.inputWrapper}>
                  <Mail size={16} color={Colors.slate} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { paddingLeft: 40 }]}
                    placeholder="family.member@email.com"
                    placeholderTextColor={Colors.slate}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Role selection dropdown helper */}
                <View style={s.roleSelectorContainer}>
                  <Typography variant="xs" weight="bold" color="navy" style={{ marginBottom: Spacing.xs }}>
                    Select Role:
                  </Typography>
                  <View style={s.roleTabs}>
                    {(['MEMBER', 'VIEWER'] as const).map(role => (
                      <TouchableOpacity
                        key={role}
                        style={[s.roleTab, inviteRole === role && s.roleTabActive]}
                        onPress={() => setInviteRole(role)}
                      >
                        <Typography
                          variant="caption"
                          weight="semiBold"
                          color={inviteRole === role ? 'white' : 'navy'}
                        >
                          {role}
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={s.button}
                  onPress={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <UserPlus size={16} color="white" />
                      <Typography weight="bold" color="white">Send Invitation</Typography>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>
      ) : (
        <Card style={s.bannerCard}>
          <AlertCircle size={18} color={Colors.slate} />
          <Typography variant="caption" color="slate" style={{ flex: 1, marginLeft: Spacing.sm }}>
            You are a workspace member. Only owners and administrators can invite new members.
          </Typography>
        </Card>
      )}

      {/* Active Members List */}
      <Card>
        <Typography variant="h3" weight="bold" color="navy" style={{ marginBottom: Spacing.md }}>
          Workspace members ({members.length})
        </Typography>

        {members.map(member => {
          const userEmail = member.user?.email || 'N/A';
          const userName = member.user?.name || userEmail.split('@')[0];
          const initials = userName.substring(0, 2).toUpperCase();

          return (
            <View key={member.id} style={s.memberRow}>
              <View style={s.avatar}>
                <Typography variant="body" weight="bold" color="white">{initials}</Typography>
              </View>
              <View style={s.memberDetails}>
                <Typography variant="body" weight="bold" color="navy">
                  {userName} {member.userId === user?.id && '(You)'}
                </Typography>
                <Typography variant="caption" color="slate">{userEmail}</Typography>
              </View>
              {renderRoleBadge(member.role)}
            </View>
          );
        })}
      </Card>

      {/* Pending Invites List */}
      {invites.length > 0 && (
        <Card>
          <Typography variant="h3" weight="bold" color="navy" style={{ marginBottom: Spacing.md }}>
            Pending invitations ({invites.length})
          </Typography>

          {invites.map(invite => (
            <View key={invite.id} style={s.memberRow}>
              <View style={[s.avatar, { backgroundColor: '#fef3c7' }]}>
                <Mail size={16} color="#d97706" />
              </View>
              <View style={s.memberDetails}>
                <Typography variant="body" weight="medium" color="navy">{invite.email}</Typography>
                <Typography variant="caption" color="slate">Expires: {new Date(invite.expiresAt).toLocaleDateString()}</Typography>
              </View>
              <Badge text="Pending" variant="amber" />
            </View>
          ))}
        </Card>
      )}

      {/* Danger Zone: Delete Workspace */}
      {userRole === 'OWNER' && (
        <Card style={s.dangerCard}>
          <Typography variant="h3" weight="bold" color="red" style={{ marginBottom: Spacing.sm, color: '#dc2626' }}>
            Danger Zone
          </Typography>
          <Typography variant="xs" color="slate" style={{ marginBottom: Spacing.md }}>
            Permanently delete this workspace and revoke all member access. All shared loans will automatically revert to personal loans. This action is irreversible.
          </Typography>
          <TouchableOpacity
            style={s.deleteButton}
            onPress={handleDeleteWorkspace}
          >
            <Typography weight="bold" color="white">Delete Workspace</Typography>
          </TouchableOpacity>
        </Card>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.base, paddingTop: Spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white, borderRadius: Radius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#09111f', shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.08, shadowRadius: 22, elevation: 4,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  badgeText: { letterSpacing: 0.6 },
  title: { letterSpacing: -0.8, marginBottom: Spacing.sm },
  desc: { lineHeight: 22 },
  emptyCard: { alignItems: 'center', padding: Spacing.xl, marginVertical: Spacing.md },
  formGroup: { width: '100%', gap: Spacing.md, marginTop: Spacing.md },
  inputWrapper: { position: 'relative', width: '100%' },
  inputIcon: { position: 'absolute', left: 14, top: 14, zIndex: 1 },
  input: {
    width: '100%', height: 46, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.borderMid, backgroundColor: '#f8fafc',
    paddingHorizontal: Spacing.base, fontSize: 16,
    fontFamily: 'Manrope-Medium', color: Colors.navy,
  },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.emerald, borderRadius: Radius.button, height: 46,
    shadowColor: '#118c76', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 15, elevation: 4,
  },
  bannerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: Spacing.md },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  avatar: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md
  },
  memberDetails: { flex: 1 },
  roleSelectorContainer: { width: '100%' },
  roleTabs: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  roleTab: {
    flex: 1, height: 38, borderRadius: Radius.sm, borderWidth: 1,
    borderColor: Colors.borderMid, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white
  },
  roleTabActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy
  },
  linkCopyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    alignItems: 'center'
  },
  linkTextContainer: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#d1fae5',
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm
  },
  linkText: {
    fontSize: 13,
    fontFamily: 'IBMPlexMono',
    color: '#065f46'
  },
  copyButton: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.emerald,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetLinkBtn: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs
  },
  dangerCard: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2'
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    borderRadius: Radius.button,
    height: 46,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4
  }
});
