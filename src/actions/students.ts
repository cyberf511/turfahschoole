'use server';

import crypto from 'crypto';
import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { encrypt, decrypt, getLastThreeDigits } from '@/lib/encryption';
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

  const { data: existingRecords } = await adminSupabase
    .from('pre_registered_students')
    .select('national_id_encrypted');

  if (existingRecords && existingRecords.length > 0) {
    for (const record of existingRecords) {
      try {
        const decryptedId = decrypt(record.national_id_encrypted);
        if (decryptedId === student.national_id.trim()) {
          return { success: false, error: 'رقم الهوية مسجل مسبقاً' };
        }
      } catch {
        // Skip records that can't be decrypted
      }
    }
  }

  const { error } = await adminSupabase
    .from('pre_registered_students')
    .insert({
      email: student.email.toLowerCase().trim(),
      full_name: student.full_name,
      national_id_encrypted: encrypt(student.national_id.trim()),
      national_id_last3: getLastThreeDigits(student.national_id.trim()),
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

  await adminSupabase.from('audit_logs').insert({
    admin_id: user.id,
    action_type: 'ADD_STUDENT',
    description: `تم إضافة طالبة: ${student.full_name}`,
    target_email: student.email.toLowerCase().trim(),
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

  const missingNationalId = students.find(s => !s.national_id || s.national_id.trim() === '');
  if (missingNationalId) {
    return { success: false, error: 'رقم الهوية مطلوب لجميع الطالبات. يرجى التأكد من تعبئة العمود في ملف الإكسل' };
  }

  const adminSupabase = createAdminSupabase();

  const { data: existingRecords } = await adminSupabase
    .from('pre_registered_students')
    .select('national_id_encrypted');

  if (existingRecords && existingRecords.length > 0) {
    const existingDecrypted = new Set<string>();
    for (const record of existingRecords) {
      try {
        const decrypted = decrypt(record.national_id_encrypted);
        existingDecrypted.add(decrypted);
      } catch {
        // Skip records that can't be decrypted
      }
    }
    
    const duplicateInDb = students.find(s => existingDecrypted.has(s.national_id.trim()));
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
        national_id_encrypted: encrypt(s.national_id.trim()),
        national_id_last3: getLastThreeDigits(s.national_id.trim()),
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
    description: `تم رفع ${students.length} طالبة عبر ملف الإكسل`,
  });

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

  // Decrypt national_id for display
  const decryptedData = (data || []).map(item => {
    let nationalId = '';
    if (item.national_id_encrypted) {
      try {
        nationalId = decrypt(item.national_id_encrypted);
      } catch {
        nationalId = item.national_id_last3 || '';
      }
    } else if (item.national_id) {
      // Backward compatibility
      nationalId = item.national_id;
    }
    return { ...item, national_id: nationalId };
  });

  return { success: true, data: decryptedData };
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
    // Check for duplicate by decrypting all records
    const { data: existingRecords } = await adminSupabase
      .from('pre_registered_students')
      .select('id, national_id_encrypted');

    if (existingRecords) {
      for (const record of existingRecords) {
        if (record.id === id) continue;
        try {
          const decrypted = decrypt(record.national_id_encrypted);
          if (decrypted === updates.national_id.trim()) {
            return { success: false, error: 'رقم الهوية مسجل مسبقاً لطالبة أخرى' };
          }
        } catch {
          // Skip
        }
      }
    }
  }

  const updatePayload: Record<string, unknown> = {
    email: updates.email?.toLowerCase().trim(),
    full_name: updates.full_name,
    phone: updates.phone || null,
  };

  if (updates.national_id) {
    updatePayload.national_id_encrypted = encrypt(updates.national_id.trim());
    updatePayload.national_id_last3 = getLastThreeDigits(updates.national_id.trim());
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
