'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { ActionResponse, PaginatedResponse } from '@/types';
import { createNotification } from './notifications';

export async function uploadCertificate(applicationId: string, certificatePath: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();

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

export async function getCertificatesForReview(
  page = 1,
  limit = 10
): Promise<PaginatedResponse<unknown[]> & { stats?: any }> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  let query = supabase
    .from('applications')
    .select('*, opportunity:opportunities(title, hours), student:profiles!student_id(full_name, email, avatar_url)', { count: 'exact' });

  // Only those under review or verified maybe? The user wants all certificates or just for review?
  // Certificates page says: "مراجعة وتوثيق شهادات الإنجاز" so we'll fetch all that have certificates
  query = query.not('certificate_url', 'is', null);

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order('certificate_uploaded_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  
  // Stats
  const { data: allData, error: statsError } = await supabase.from('applications').select('completion_status').not('certificate_url', 'is', null);
  let stats = null;
  if (!statsError && allData) {
    stats = {
      total: allData.length,
      pending: allData.filter(a => a.completion_status === 'completed_under_review').length,
      verified: allData.filter(a => a.completion_status === 'verified').length
    };
  }

  if (error) return { success: false, error: 'فشل في تحميل الشهادات' };
  return { 
    success: true, 
    data: data || [],
    totalCount: count || 0,
    totalPages: count ? Math.ceil(count / limit) : 0,
    currentPage: page,
    stats
  };
}

export async function verifyCertificate(applicationId: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
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

  const supabase = await createServerSupabase();
  
  // Sanitize filename to avoid Signed URL and RLS extension policy mismatch due to spaces/arabic characters
  const extension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '').replace(`.${extension}`, '') || 'cert';
  const filePath = `certificates/${user.id}/${Date.now()}-${safeName}.${extension}`;

  const { data, error } = await supabase.storage
    .from('certificates')
    .createSignedUploadUrl(filePath);

  if (error) return { success: false, error: 'فشل في إنشاء رابط الرفع' };
  return { success: true, data: { signedUrl: data.signedUrl, path: filePath } };
}

export async function getSignedDownloadUrl(path: string): Promise<ActionResponse<string>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.storage
    .from('certificates')
    .createSignedUrl(path, 3600); // 1 hour

  if (error) return { success: false, error: 'فشل في إنشاء رابط التحميل' };
  return { success: true, data: data.signedUrl };
}

export async function createExternalCertificateApplication(hours: number, title: string = 'منصة التطوع'): Promise<ActionResponse<string>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();

  // 1. Create a hidden custom opportunity for these specific hours
  const { data: opp, error: oppError } = await supabase
    .from('opportunities')
    .insert({
      title,
      description: 'شهادة خارجية تم رفعها من قبل الطالبة للاعتماد',
      location: 'جهة خارجية',
      hours: hours,
      is_active: false, // Hidden from regular list
      created_by: user.id,
    })
    .select('id')
    .single();

  if (oppError || !opp) return { success: false, error: 'فشل في إنشاء سجل الشهادة الخارجية' };

  // 2. Create a pending application for this opportunity
  const { data: app, error: appError } = await supabase
    .from('applications')
    .insert({
      opportunity_id: opp.id,
      student_id: user.id,
      status: 'pending'
    })
    .select('id')
    .single();

  if (appError || !app) return { success: false, error: 'فشل في تقديم الطلب' };

  return { success: true, data: app.id };
}
