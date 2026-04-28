'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { ActionResponse, Profile } from '@/types';

export async function getAllUsers(): Promise<ActionResponse<Profile[]>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') {
    return { success: false, error: 'غير مصرح' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: 'فشل في تحميل المستخدمين' };
  return { success: true, data: data || [] };
}

export async function updateUserRole(
  targetUserId: string,
  newRole: 'student' | 'coordinator'
): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') {
    return { success: false, error: 'غير مصرح - يحق فقط للمشرف العام تغيير الأدوار' };
  }

  // Prevent modifying super_admin
  const { data: targetProfile } = await supabase.from('profiles').select('role').eq('id', targetUserId).single();
  if (targetProfile?.role === 'super_admin') {
    return { success: false, error: 'لا يمكن تعديل دور المشرف العام' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId);

  if (error) return { success: false, error: 'فشل في تحديث الدور' };
  return { success: true };
}
