'use server';

import crypto from 'crypto';
import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { encrypt, getLastThreeDigits } from '@/lib/encryption';
import { PreRegisteredStudentSchema } from '@/lib/validations';
import type { ActionResponse } from '@/types';

export interface PreRegisteredStudent {
  id?: string;
  email: string;
  full_name: string;
  national_id: string;
  phone?: string;
  education_level?: string;
}

function hashNationalId(nationalId: string): string {
  return crypto.createHash('sha256').update(nationalId.trim()).digest('hex');
}

export async function addPreRegisteredStudent(student: PreRegisteredStudent): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const validated = PreRegisteredStudentSchema.safeParse(student);
  if (!validated.success) return { success: false, error: 'البيانات غير صالحة: ' + validated.error.issues[0]?.message };
  const validData = validated.data;

  const adminSupabase = createAdminSupabase();
  const nationalIdHash = hashNationalId(validData.national_id);

  const { data: existing } = await adminSupabase
    .from('pre_registered_students')
    .select('id')
    .eq('national_id_hash', nationalIdHash)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'رقم الهوية مسجل مسبقاً' };
  }

  const { error } = await adminSupabase
    .from('pre_registered_students')
    .insert({
      email: validData.email.toLowerCase().trim(),
      full_name: validData.full_name,
      national_id_encrypted: encrypt(validData.national_id.trim()),
      national_id_last3: getLastThreeDigits(validData.national_id.trim()),
      national_id_hash: nationalIdHash,
      phone: validData.phone || null,
      education_level: validData.education_level || 'first_secondary'
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'هذا البريد مسجل مسبقاً' };
    }
    console.error('Insert Error:', error);
    return { success: false, error: 'فشل في إضافة الطالبة' };
  }

  await adminSupabase.from('audit_logs').insert({
    admin_id: user.id,
    action_type: 'ADD_STUDENT',
    description: `تم إضافة طالبة: ${validData.full_name}`,
    target_email: validData.email.toLowerCase().trim(),
  });

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

  if (students.length > 2000) {
    return { success: false, error: 'الحد الأقصى 2000 طالبة لكل رفع' };
  }

  // Validate all rows with Zod first
  const validationErrors: string[] = [];
  const validStudents: PreRegisteredStudent[] = [];
  for (let i = 0; i < students.length; i++) {
    const result = PreRegisteredStudentSchema.safeParse(students[i]);
    if (result.success) {
      validStudents.push(result.data as PreRegisteredStudent);
    } else {
      validationErrors.push(`الطالبة ${i + 1}: ${result.error.issues[0]?.message}`);
    }
  }
  if (validationErrors.length > 0) {
    return { success: false, error: `أخطاء في التحقق من البيانات:\n${validationErrors.slice(0, 5).join('\n')}` };
  }

  const adminSupabase = createAdminSupabase();

  // Check duplicates via hash
  const existingHashes = new Set<string>();
  const { data: existingRecords } = await adminSupabase
    .from('pre_registered_students')
    .select('national_id_hash');
  if (existingRecords) {
    for (const record of existingRecords) {
      if (record.national_id_hash) existingHashes.add(record.national_id_hash);
    }
  }

  const idsInFile = validStudents.map(s => s.national_id.trim());
  const uniqueIdsInFile = new Set(idsInFile);
  if (uniqueIdsInFile.size !== validStudents.length) {
    return { success: false, error: 'يوجد تكرار في أرقام الهوية داخل الملف نفسه' };
  }

  for (const s of validStudents) {
    if (existingHashes.has(hashNationalId(s.national_id))) {
      return { success: false, error: `رقم الهوية "${s.national_id}" مسجل مسبقاً لطالبة موجودة` };
    }
  }

  const { data, error } = await adminSupabase
    .from('pre_registered_students')
    .upsert(
      validStudents.map(s => ({
        email: s.email.toLowerCase().trim(),
        full_name: s.full_name,
        national_id_encrypted: encrypt(s.national_id.trim()),
        national_id_last3: getLastThreeDigits(s.national_id.trim()),
        national_id_hash: hashNationalId(s.national_id),
        phone: s.phone || null,
        education_level: s.education_level || 'first_secondary'
      })),
      { onConflict: 'email' }
    );

  if (error) {
    console.error('Bulk Insert Error:', error);
    return { success: false, error: 'فشل في رفع القائمة، تأكدي من صحة الأعمدة.' };
  }

  await adminSupabase.from('audit_logs').insert({
    admin_id: user.id,
    action_type: 'BULK_ADD_STUDENTS',
    description: `تم رفع ${validStudents.length} طالبة عبر ملف الإكسل`,
  });

  return { success: true, data: { count: validStudents.length } };
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

  // Return masked national ID (last 3 digits only) instead of full decrypted value
  const processedData = (data || []).map(item => ({
    ...item,
    national_id: item.national_id_last3 ? `*******${item.national_id_last3}` : '—'
  }));

  return { success: true, data: processedData };
}

export async function updatePreRegisteredStudent(id: string, updates: Partial<PreRegisteredStudent>): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const validated = PreRegisteredStudentSchema.partial().safeParse(updates);
  if (!validated.success) return { success: false, error: 'البيانات غير صالحة: ' + validated.error.issues[0]?.message };
  const validData = validated.data;

  const adminSupabase = createAdminSupabase();

  if (validData.national_id) {
    const hash = hashNationalId(validData.national_id);
    const { data: existing } = await adminSupabase
      .from('pre_registered_students')
      .select('id')
      .eq('national_id_hash', hash)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'رقم الهوية مسجل مسبقاً لطالبة أخرى' };
    }
  }

  const updatePayload: Record<string, unknown> = {
    email: validData.email?.toLowerCase().trim(),
    full_name: validData.full_name,
    phone: validData.phone || null,
  };

  if (validData.national_id) {
    updatePayload.national_id_encrypted = encrypt(validData.national_id.trim());
    updatePayload.national_id_last3 = getLastThreeDigits(validData.national_id.trim());
    updatePayload.national_id_hash = hashNationalId(validData.national_id);
  }

  const { error } = await adminSupabase
    .from('pre_registered_students')
    .update(updatePayload)
    .eq('id', id);

  if (error) return { success: false, error: 'فشل في تحديث بيانات الطالبة' };

  await adminSupabase.from('audit_logs').insert({
    admin_id: user.id,
    action_type: 'UPDATE_STUDENT',
    description: 'تم تحديث بيانات طالبة مسجلة مسبقاً',
    target_id: id,
  });

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

  await adminSupabase.from('audit_logs').insert({
    admin_id: user.id,
    action_type: 'DELETE_STUDENT',
    description: 'تم حذف طالبة مسجلة مسبقاً',
    target_id: id,
  });

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

  await adminSupabase.from('audit_logs').insert({
    admin_id: user.id,
    action_type: 'BULK_DELETE_STUDENTS',
    description: `تم حذف ${ids.length} طالبة`,
  });

  return { success: true };
}
