'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { ActionResponse, Application } from '@/types';
import { createNotification } from './notifications';
import { sendEmail, emailApproved, emailRejected } from '@/lib/email';

export async function getMyApplications(): Promise<ActionResponse<Application[]>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('applications')
    .select('*, opportunity:opportunities(title, location, hours, description)')
    .eq('student_id', user.id)
    .order('applied_at', { ascending: false });

  if (error) return { success: false, error: 'فشل في تحميل الطلبات' };
  return { success: true, data: data || [] };
}

export async function getAllApplications(status?: string): Promise<ActionResponse<Application[]>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  let query = supabase
    .from('applications')
    .select('*, opportunity:opportunities(title, location, hours), student:profiles!student_id(full_name, email, avatar_url, phone, education_level, national_id_last3)')
    .order('applied_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return { success: false, error: 'فشل في تحميل الطلبات' };
  return { success: true, data: data || [] };
}

export async function applyToOpportunity(opportunityId: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();

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
  return { success: true };
}

export async function reviewApplication(
  applicationId: string,
  action: 'approve' | 'reject',
  reason?: string
): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
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

  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('applications')
    .select('opportunity:opportunities(hours)')
    .eq('student_id', user.id)
    .eq('completion_status', 'verified');

  if (error) return { success: false, error: 'فشل في حساب الساعات' };

  const totalHours = (data || []).reduce((sum, app) => {
    const hours = ((app.opportunity as unknown) as { hours: number })?.hours || 0;
    return sum + hours;
  }, 0);

  return { success: true, data: totalHours };
}
