'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import type { ActionResponse, Opportunity, OpportunityFormData } from '@/types';

export async function getOpportunities(activeOnly = true): Promise<ActionResponse<Opportunity[]>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = createAdminSupabase();
  let query = supabase.from('opportunities').select('*, creator:profiles!created_by(full_name, avatar_url)');

  if (activeOnly) query = query.eq('is_active', true);
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return { success: false, error: 'فشل في تحميل الفرص' };
  return { success: true, data: data || [] };
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
