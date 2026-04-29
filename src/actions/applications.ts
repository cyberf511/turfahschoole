'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { ActionResponse, PaginatedResponse, Application } from '@/types';
import { createNotification } from './notifications';
import { sendEmail, emailApproved, emailRejected, emailApplicationReceived } from '@/lib/email';

export async function getMyApplications(): Promise<ActionResponse<Application[]>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('applications')
    .select('*, opportunity:opportunities(title, location, hours, description)')
    .eq('student_id', user.id)
    .order('applied_at', { ascending: false });

  if (error) return { success: false, error: 'فشل في تحميل الطلبات' };
  return { success: true, data: data || [] };
}

export async function getAllApplications(
  status?: string,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Application[]> & { stats?: any }> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  let query = supabase
    .from('applications')
    .select('*, opportunity:opportunities(title, location, hours), student:profiles!student_id(full_name, email, avatar_url, phone, education_level, national_id_last3)', { count: 'exact' });

  if (status && status !== 'all') query = query.eq('status', status);

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order('applied_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  
  // Fetch stats using fast exact counts via Database RPC
  const { data: rpcStats, error: rpcError } = await supabase.rpc('get_application_stats');

  const stats = {
    total: rpcStats?.total || 0,
    pending: rpcStats?.pending || 0,
    approved: rpcStats?.approved || 0,
    rejected: rpcStats?.rejected || 0
  };

  if (error) return { success: false, error: 'فشل في تحميل الطلبات' };
  return { 
    success: true, 
    data: data || [],
    totalCount: count || 0,
    totalPages: count ? Math.ceil(count / limit) : 0,
    currentPage: page,
    stats
  };
}

export async function applyToOpportunity(opportunityId: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();

  // Check if already applied
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .eq('student_id', user.id)
    .single();

  if (existing) return { success: false, error: 'لقد تقدمت لهذه الفرصة مسبقاً' };

  const { error } = await supabase.from('applications').insert({
    opportunity_id: opportunityId,
    student_id: user.id,
    status: 'pending',
  });

  if (error) return { success: false, error: 'فشل في تقديم الطلب' };

  // Fetch student info & opportunity title to send the confirmation email
  const { data: studentData } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
  const { data: oppData } = await supabase.from('opportunities').select('title').eq('id', opportunityId).single();

  if (studentData?.email && oppData?.title) {
    const emailContent = emailApplicationReceived(studentData.full_name || 'طالبة', oppData.title);
    sendEmail({
      to: studentData.email,
      subject: emailContent.subject,
      html: emailContent.html,
    }).catch(err => console.error('Failed to send application received email:', err));
  }

  return { success: true };
}

export async function reviewApplication(
  applicationId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const status = action === 'approve' ? 'approved' : 'rejected';
  const { data: app, error } = await supabase
    .from('applications')
    .update({
      status,
      rejection_reason: action === 'reject' ? reason : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', applicationId)
    .select('student_id, opportunity:opportunities(title)')
    .single();

  if (error) return { success: false, error: 'فشل في مراجعة الطلب' };

  // Send notification + email to student
  if (app) {
    const oppTitle = ((app.opportunity as unknown) as { title: string })?.title || '';
    const notifTitle = action === 'approve' ? 'تم قبول طلبك' : 'تم رفض طلبك';
    const notifMessage = action === 'approve'
      ? `تم قبول طلبك للفرصة: ${oppTitle}`
      : `تم رفض طلبك للفرصة: ${oppTitle}${reason ? ` - السبب: ${reason}` : ''}`;

    await createNotification({
      userId: app.student_id,
      title: notifTitle,
      message: notifMessage,
      type: action === 'approve' ? 'application_approved' : 'application_rejected',
      relatedApplicationId: applicationId,
    });

    // Send email
    const { data: studentProfile } = await supabase.from('profiles').select('email, full_name').eq('id', app.student_id).single();
    if (studentProfile?.email) {
      const template = action === 'approve'
        ? emailApproved(studentProfile.full_name || 'طالبة', oppTitle)
        : emailRejected(studentProfile.full_name || 'طالبة', oppTitle, reason);
      sendEmail({ to: studentProfile.email, ...template }).catch(() => {});
    }
  }

  return { success: true };
}

export async function getStudentHours(): Promise<ActionResponse<number>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc('get_student_total_hours', { p_student_id: user.id });

  if (error) return { success: false, error: 'فشل في حساب الساعات' };

  return { success: true, data: data || 0 };
}

export async function bulkUpdateApplicationsStatus(
  ids: string[],
  action: 'approve' | 'reject',
  reason?: string
): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  // We loop to reuse the email and notification logic
  const results = await Promise.all(
    ids.map((id) => reviewApplication(id, action, reason))
  );

  const failedCount = results.filter((r) => !r.success).length;

  if (failedCount > 0) {
    return { 
      success: true, // we still say success but with a warning, or false?
      error: `تم إنجاز العملية مع فشل ${failedCount} طلبات` 
    };
  }

  return { success: true };
}
