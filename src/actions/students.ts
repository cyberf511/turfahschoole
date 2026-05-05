'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { ActionResponse } from '@/types';

export interface PreRegisteredStudent {
  id?: string;
  email: string;
  full_name: string;
  national_id: string;
  phone?: string;
  education_level?: string;
}

export async function addPreRegisteredStudent(student: PreRegisteredStudent): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  if (!student.national_id || student.national_id.trim() === '') {
    return { success: false, error: 'رقم الهوية مطلوب' };
  }

  const adminSupabase = createAdminSupabase();

  const { data: existingNationalId } = await adminSupabase
    .from('pre_registered_students')
    .select('id')
    .eq('national_id', student.national_id.trim())
    .single();

  if (existingNationalId) {
    return { success: false, error: 'رقم الهوية مسجل مسبقاً' };
  }

  const { error } = await adminSupabase
    .from('pre_registered_students')
    .insert({
      email: student.email.toLowerCase().trim(),
      full_name: student.full_name,
      national_id: student.national_id.trim(),
      phone: student.phone || null,
      education_level: student.education_level || 'first_secondary'
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'هذا البريد مسجل مسبقاً' };
    }
    console.error('Insert Error:', error);
    return { success: false, error: 'فشل في إضافة الطالبة' };
  }
  return { success: true };
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

  const missingNationalId = students.find(s => !s.national_id || s.national_id.trim() === '');
  if (missingNationalId) {
    return { success: false, error: 'رقم الهوية مطلوب لجميع الطالبات. يرجى التأكد من تعبئة العمود في ملف الإكسل' };
  }

  const adminSupabase = createAdminSupabase();

  const { data: existingRecords } = await adminSupabase
    .from('pre_registered_students')
    .select('national_id');

  if (existingRecords && existingRecords.length > 0) {
    const existingIds = new Set(existingRecords.map(r => r.national_id));
    const duplicateInDb = students.find(s => existingIds.has(s.national_id.trim()));
    if (duplicateInDb) {
      return { success: false, error: `رقم الهوية "${duplicateInDb.national_id}" مسجل مسبقاً لطالبة موجودة` };
    }
  }

  const idsInFile = students.map(s => s.national_id.trim());
  const uniqueIdsInFile = new Set(idsInFile);
  if (uniqueIdsInFile.size !== students.length) {
    return { success: false, error: 'يوجد تكرار في أرقام الهوية داخل الملف نفسه' };
  }

  const { data, error } = await adminSupabase
    .from('pre_registered_students')
    .upsert(
      students.map(s => ({
        email: s.email.toLowerCase().trim(),
        full_name: s.full_name,
        national_id: s.national_id.trim(),
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

  if (updates.national_id !== undefined && (!updates.national_id || updates.national_id.trim() === '')) {
    return { success: false, error: 'رقم الهوية مطلوب' };
  }

  const adminSupabase = createAdminSupabase();

  if (updates.national_id) {
    const { data: existingNationalId } = await adminSupabase
      .from('pre_registered_students')
      .select('id')
      .eq('national_id', updates.national_id.trim())
      .neq('id', id)
      .single();

    if (existingNationalId) {
      return { success: false, error: 'رقم الهوية مسجل مسبقاً لطالبة أخرى' };
    }
  }

  const { error } = await adminSupabase
    .from('pre_registered_students')
    .update({
      email: updates.email?.toLowerCase().trim(),
      full_name: updates.full_name,
      national_id: updates.national_id ? updates.national_id.trim() : undefined,
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
