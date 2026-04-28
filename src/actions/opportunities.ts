'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { OpportunitySchema, OpportunityUpdateSchema } from '@/lib/validations';
import type { ActionResponse, PaginatedResponse, Opportunity, OpportunityFormData } from '@/types';

export async function getOpportunities(
  activeOnly = false,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Opportunity[]> & { stats?: any }> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  let query = supabase.from('opportunities').select('*, creator:profiles!created_by(full_name, avatar_url)', { count: 'exact' });

  if (activeOnly) query = query.eq('is_active', true);
  
  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  
  // Fetch stats for the opportunities dashboard using exact counts
  const [
    { count: totalCount },
    { count: activeCount },
    { count: inactiveCount },
    { data: hoursData }
  ] = await Promise.all([
    supabase.from('opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('opportunities').select('hours')
  ]);

  const stats = {
    total: totalCount || 0,
    active: activeCount || 0,
    inactive: inactiveCount || 0,
    totalHours: (hoursData || []).reduce((acc, curr) => acc + (curr.hours || 0), 0)
  };

  if (error) return { success: false, error: 'فشل في تحميل الفرص' };
  
  return { 
    success: true, 
    data: data || [], 
    totalCount: count || 0,
    totalPages: count ? Math.ceil(count / limit) : 0,
    currentPage: page,
    stats
  };
}

export async function getOpportunity(id: string): Promise<ActionResponse<Opportunity>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, creator:profiles!created_by(full_name, avatar_url)')
    .eq('id', id)
    .single();

  if (error) return { success: false, error: 'فشل في تحميل الفرصة' };
  return { success: true, data };
}

export async function createOpportunity(formData: OpportunityFormData): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();

  // Verify coordinator or super_admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح لك بإنشاء فرص' };
  }

  const validated = OpportunitySchema.safeParse(formData);
  if (!validated.success) return { success: false, error: 'البيانات غير صالحة' };
  const validData = validated.data;

  const { error } = await supabase.from('opportunities').insert({
    created_by: user.id,
    title: validData.title,
    description: validData.description,
    location: validData.location,
    hours: validData.hours,
    requirements: validData.requirements || null,
    max_participants: validData.max_participants || null,
    start_date: validData.start_date || null,
    end_date: validData.end_date || null,
  });

  if (error) return { success: false, error: 'فشل في إنشاء الفرصة' };
  return { success: true };
}

export async function updateOpportunity(id: string, formData: Partial<OpportunityFormData>): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const validated = OpportunityUpdateSchema.safeParse(formData);
  if (!validated.success) return { success: false, error: 'البيانات غير صالحة' };

  const { error } = await supabase.from('opportunities').update({
    ...validated.data,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) return { success: false, error: 'فشل في تحديث الفرصة' };
  return { success: true };
}

export async function toggleOpportunity(id: string, isActive: boolean): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('opportunities').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
  
  if (!error) {
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action_type: isActive ? 'ACTIVATE_OPPORTUNITY' : 'DEACTIVATE_OPPORTUNITY',
      description: `تم ${isActive ? 'تفعيل' : 'إيقاف'} فرصة`,
      target_id: id
    });
  }
  
  if (error) return { success: false, error: 'فشل في تحديث الحالة' };
  return { success: true };
}

export async function deleteOpportunity(id: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  // Find related applications first
  const { data: apps } = await supabase.from('applications').select('id').eq('opportunity_id', id);
  if (apps && apps.length > 0) {
    const appIds = apps.map((a: any) => a.id);
    // Delete notifications related to these applications
    await supabase.from('notifications').delete().in('related_application_id', appIds);
    // Delete applications
    await supabase.from('applications').delete().in('id', appIds);
  }

  const { error } = await supabase.from('opportunities').delete().eq('id', id);
  
  if (!error) {
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action_type: 'DELETE_OPPORTUNITY',
      description: 'تم حذف فرصة',
      target_id: id
    });
  }

  if (error) return { success: false, error: 'فشل في حذف الفرصة' };
  return { success: true };
}
