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
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('Notification')
    .select('*')
    .eq('userId', user.user.id)
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
  const { data: user, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('Notification')
    .update({ isRead: true })
    .eq('userId', user.user.id)
    .eq('isRead', false);

  if (error) throw error;
}
