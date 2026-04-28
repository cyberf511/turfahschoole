'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { ActionResponse, Notification, NotificationType } from '@/types';

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedApplicationId?: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<ActionResponse> {
  const supabase = createAdminSupabase();
  const { error } = await supabase.from('notifications').insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    related_application_id: input.relatedApplicationId || null,
  });

  if (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'فشل في إنشاء الإشعار' };
  }
  return { success: true };
}

export async function getNotifications(): Promise<ActionResponse<Notification[]>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { success: false, error: 'فشل في تحميل الإشعارات' };
  return { success: true, data: data || [] };
}

export async function getUnreadCount(): Promise<ActionResponse<number>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { success: false, error: 'فشل' };
  return { success: true, data: count || 0 };
}

export async function markAsRead(notificationId: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: 'فشل' };
  return { success: true };
}

export async function markAllAsRead(): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { success: false, error: 'فشل' };
  return { success: true };
}
