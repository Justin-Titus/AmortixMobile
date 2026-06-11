import { supabase } from '@/lib/supabase';

export type NotificationRecord = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export async function getNotifications(): Promise<NotificationRecord[]> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user;
  if (authError || !user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('Notification')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return data as NotificationRecord[];
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('Notification')
    .update({ isRead: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user;
  if (authError || !user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('Notification')
    .update({ isRead: true })
    .eq('userId', user.id)
    .eq('isRead', false);

  if (error) throw error;
}
