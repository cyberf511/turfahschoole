'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { ActionResponse } from '@/types';
import { createNotification } from './notifications';

export async function uploadCertificate(applicationId: string, certificatePath: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();

  // Verify the application belongs to the user and is approved
  const { data: app } = await supabase
    .from('applications')
    .select('id, student_id, status')
    .eq('id', applicationId)
    .eq('student_id', user.id)
    .eq('status', 'approved')
    .single();

  if (!app) return { success: false, error: 'لم يتم العثور على الطلب أو غير مؤهل لرفع الشهادة' };

  const { error } = await supabase
    .from('applications')
    .update({
      certificate_url: certificatePath,
      certificate_uploaded_at: new Date().toISOString(),
      completion_status: 'completed_under_review',
    })
    .eq('id', applicationId);

  if (error) return { success: false, error: 'فشل في تحديث حالة الشهادة' };
  return { success: true };
}

export async function getCertificatesForReview(): Promise<ActionResponse<unknown[]>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*, opportunity:opportunities(title, hours), student:profiles!student_id(full_name, email, avatar_url)')
    .eq('completion_status', 'completed_under_review')
    .order('certificate_uploaded_at', { ascending: false });

  if (error) return { success: false, error: 'فشل في تحميل الشهادات' };
  return { success: true, data: data || [] };
}

export async function verifyCertificate(applicationId: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const { data: app, error } = await supabase
    .from('applications')
    .update({
      completion_status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq('id', applicationId)
    .select('student_id, opportunity:opportunities(title)')
    .single();

  if (error) return { success: false, error: 'فشل في توثيق الشهادة' };

  if (app) {
    const oppTitle = ((app.opportunity as unknown) as { title: string })?.title || '';
    await createNotification({
      userId: app.student_id,
      title: 'تم توثيق شهادتك',
      message: `تم توثيق شهادتك للفرصة: ${oppTitle}`,
      type: 'certificate_verified',
      relatedApplicationId: applicationId,
    });
  }

  return { success: true };
}

export async function getSignedUploadUrl(fileName: string): Promise<ActionResponse<{ signedUrl: string; path: string }>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const filePath = `certificates/${user.id}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from('certificates')
    .createSignedUploadUrl(filePath);

  if (error) return { success: false, error: 'فشل في إنشاء رابط الرفع' };
  return { success: true, data: { signedUrl: data.signedUrl, path: filePath } };
}

export async function getSignedDownloadUrl(path: string): Promise<ActionResponse<string>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { data, error } = await supabase.storage
    .from('certificates')
    .createSignedUrl(path, 3600); // 1 hour

  if (error) return { success: false, error: 'فشل في إنشاء رابط التحميل' };
  return { success: true, data: data.signedUrl };
}
