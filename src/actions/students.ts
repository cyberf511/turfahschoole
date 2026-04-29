'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { ActionResponse } from '@/types';

export interface PreRegisteredStudent {
  id?: string;
  email: string;
  full_name: string;
  national_id?: string;
  phone?: string;
  education_level?: string;
}

export async function bulkPreRegisterStudents(students: PreRegisteredStudent[]): Promise<ActionResponse<{ count: number }>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();

  // Verify coordinator or super_admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  if (!students || students.length === 0) {
    return { success: false, error: 'لم يتم العثور على طالبات في الملف' };
  }

  // Insert into pre_registered_students using admin client to bypass RLS
  const adminSupabase = createAdminSupabase();
  const { data, error } = await adminSupabase
    .from('pre_registered_students')
    .upsert(
      students.map(s => ({
        email: s.email.toLowerCase().trim(),
        full_name: s.full_name,
        national_id: s.national_id || null,
        phone: s.phone || null,
        education_level: s.education_level || 'first_secondary'
      })),
      { onConflict: 'email' }
    );

  if (error) {
    console.error('Bulk Insert Error:', error);
    return { success: false, error: 'فشل في رفع القائمة، تأكدي من صحة الأعمدة.' };
  }

  return { success: true, data: { count: students.length } };
}

export async function getPreRegisteredStudents(): Promise<ActionResponse<PreRegisteredStudent[]>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const adminSupabase = createAdminSupabase();
  const { data, error } = await adminSupabase
    .from('pre_registered_students')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: 'فشل في جلب البيانات' };
  return { success: true, data };
}

export async function updatePreRegisteredStudent(id: string, updates: Partial<PreRegisteredStudent>): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const adminSupabase = createAdminSupabase();
  const { error } = await adminSupabase
    .from('pre_registered_students')
    .update({
      email: updates.email?.toLowerCase().trim(),
      full_name: updates.full_name,
      national_id: updates.national_id || null,
      phone: updates.phone || null,
    })
    .eq('id', id);

  if (error) return { success: false, error: 'فشل في تحديث بيانات الطالبة' };
  return { success: true };
}

export async function deletePreRegisteredStudent(id: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const adminSupabase = createAdminSupabase();
  const { error } = await adminSupabase
    .from('pre_registered_students')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: 'فشل في حذف الطالبة' };
  return { success: true };
}

export async function bulkDeletePreRegisteredStudents(ids: string[]): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const adminSupabase = createAdminSupabase();
  const { error } = await adminSupabase
    .from('pre_registered_students')
    .delete()
    .in('id', ids);

  if (error) return { success: false, error: 'فشل في حذف الطالبات المحددة' };
  return { success: true };
}
