'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { ActionResponse, PaginatedResponse, Opportunity, OpportunityFormData } from '@/types';

export async function getOpportunities(
  activeOnly = false,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Opportunity[]> & { stats?: any }> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  let query = supabase.from('opportunities').select('*, creator:profiles!created_by(full_name, avatar_url)', { count: 'exact' });

  if (activeOnly) query = query.eq('is_active', true);
  
  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  
  // Fetch stats for the opportunities dashboard
  const { data: allData, error: statsError } = await supabase.from('opportunities').select('is_active, hours');
  let stats = null;
  if (!statsError && allData) {
    stats = {
      total: allData.length,
      active: allData.filter(o => o.is_active).length,
      inactive: allData.filter(o => !o.is_active).length,
      totalHours: allData.reduce((acc, curr) => acc + (curr.hours || 0), 0)
    };
  }

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

  const supabase = createAdminSupabase();
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

  const supabase = createAdminSupabase();

  // Verify coordinator or super_admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح لك بإنشاء فرص' };
  }

  const { error } = await supabase.from('opportunities').insert({
    created_by: user.id,
    title: formData.title,
    description: formData.description,
    location: formData.location,
    hours: formData.hours,
    requirements: formData.requirements || null,
    max_participants: formData.max_participants || null,
    start_date: formData.start_date || null,
    end_date: formData.end_date || null,
  });

  if (error) return { success: false, error: 'فشل في إنشاء الفرصة' };
  return { success: true };
}

export async function updateOpportunity(id: string, formData: Partial<OpportunityFormData>): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const { error } = await supabase.from('opportunities').update({
    ...formData,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) return { success: false, error: 'فشل في تحديث الفرصة' };
  return { success: true };
}

export async function toggleOpportunity(id: string, isActive: boolean): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  const { error } = await supabase.from('opportunities').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { success: false, error: 'فشل في تحديث الحالة' };
  return { success: true };
}

export async function deleteOpportunity(id: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
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
  if (error) return { success: false, error: 'فشل في حذف الفرصة' };
  return { success: true };
}
