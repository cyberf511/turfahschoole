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
  // Filter by coordinator's owned opportunities unless they're browsing all
  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isSuperAdmin = callerProfile?.role === 'super_admin';

  // Build stats queries with optional ownership filter
  const statsQuery = supabase.from('opportunities');
  const filteredStatsQuery = (!isSuperAdmin && !activeOnly)
    ? (statsQuery as any).eq('created_by', user.id)
    : statsQuery;

  const [
    { count: totalCount },
    { count: activeCount },
    { count: inactiveCount },
    { data: hoursData }
  ] = await Promise.all([
    filteredStatsQuery.select('*', { count: 'exact', head: true }),
    filteredStatsQuery.select('*', { count: 'exact', head: true }).eq('is_active', true),
    filteredStatsQuery.select('*', { count: 'exact', head: true }).eq('is_active', false),
    filteredStatsQuery.select('hours')
  ]);

  const stats = {
    total: totalCount || 0,
    active: activeCount || 0,
    inactive: inactiveCount || 0,
    totalHours: (hoursData || []).reduce((acc: number, curr: any) => acc + (curr.hours || 0), 0)
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

  await supabase.from('audit_logs').insert({
    admin_id: user.id,
    action_type: 'CREATE_OPPORTUNITY',
    description: `تم إنشاء فرصة: ${validData.title}`,
  });

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

  const { data: opp } = await supabase.from('opportunities').select('created_by, creator:profiles!created_by(full_name)').eq('id', id).single();
  if (!opp) return { success: false, error: 'الفرصة غير موجودة' };
  if (opp.created_by !== user.id && profile.role !== 'super_admin') {
    const creatorName = ((opp.creator as unknown) as { full_name: string })?.full_name || 'منسق آخر';
    return { success: false, error: `لا يمكنك تعديل هذه الفرصة لأنها من إنشاء "${creatorName}"` };
  }

  const validated = OpportunityUpdateSchema.safeParse(formData);
  if (!validated.success) return { success: false, error: 'البيانات غير صالحة' };

  const { error } = await supabase.from('opportunities').update({
    ...validated.data,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) return { success: false, error: 'فشل في تحديث الفرصة' };

  await supabase.from('audit_logs').insert({
    admin_id: user.id,
    action_type: 'UPDATE_OPPORTUNITY',
    description: `تم تحديث فرصة: ${id}`,
    target_id: id,
  });

  return { success: true };
}

export async function toggleOpportunity(id: string, isActive: boolean): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const { data: opp } = await supabase.from('opportunities').select('created_by, creator:profiles!created_by(full_name)').eq('id', id).single();
  if (!opp) return { success: false, error: 'الفرصة غير موجودة' };
  if (opp.created_by !== user.id && profile.role !== 'super_admin') {
    const creatorName = ((opp.creator as unknown) as { full_name: string })?.full_name || 'منسق آخر';
    return { success: false, error: `لا يمكنك ${isActive ? 'تفعيل' : 'إيقاف'} هذه الفرصة لأنها من إنشاء "${creatorName}"` };
  }

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

  const { data: opp } = await supabase.from('opportunities').select('created_by, creator:profiles!created_by(full_name)').eq('id', id).single();
  if (!opp) return { success: false, error: 'الفرصة غير موجودة' };
  if (opp.created_by !== user.id && profile.role !== 'super_admin') {
    const creatorName = ((opp.creator as unknown) as { full_name: string })?.full_name || 'منسق آخر';
    return { success: false, error: `لا يمكنك حذف هذه الفرصة لأنها من إنشاء "${creatorName}"` };
  }

  // Find related applications first
  const { data: apps } = await supabase.from('applications').select('id, completion_status').eq('opportunity_id', id);
  if (apps && apps.length > 0) {
    // Check for verified certificates
    const hasVerified = apps.some((a: any) => a.completion_status === 'verified');
    if (hasVerified) {
      return { success: false, error: 'لا يمكن حذف الفرصة لوجود شهادات موثقة مرتبطة بها، يرجى تعطيلها بدلاً من ذلك' };
    }

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

export async function bulkDeleteOpportunities(ids: string[]): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  if (profile.role !== 'super_admin') {
    const { data: opps } = await supabase.from('opportunities').select('id, created_by, creator:profiles!created_by(full_name)').in('id', ids);
    if (opps) {
      const notOwned = opps.filter(o => o.created_by !== user.id);
      if (notOwned.length > 0) {
        const names = notOwned.map(o => ((o.creator as unknown) as { full_name: string })?.full_name || 'منسق آخر');
        return { success: false, error: `لا يمكنك حذف ${notOwned.length} فرصة لأنها من إنشاء: ${names.join('، ')}` };
      }
    }
  }

  // Find related applications for ALL these opportunities
  const { data: apps } = await supabase.from('applications').select('id, opportunity_id, completion_status').in('opportunity_id', ids);
  if (apps && apps.length > 0) {
    // Prevent deletion if ANY has verified certificates
    const hasVerified = apps.some((a: any) => a.completion_status === 'verified');
    if (hasVerified) {
      return { success: false, error: 'بعض الفرص المحددة تحتوي على شهادات موثقة ولا يمكن حذفها، يرجى إلغاء تحديدها وتجربة الحذف مجدداً' };
    }

    const appIds = apps.map((a: any) => a.id);
    await supabase.from('notifications').delete().in('related_application_id', appIds);
    await supabase.from('applications').delete().in('id', appIds);
  }

  const { error } = await supabase.from('opportunities').delete().in('id', ids);
  
  if (!error) {
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action_type: 'BULK_DELETE_OPPORTUNITIES',
      description: `تم حذف ${ids.length} فرصة تطوعية`,
    });
  }

  if (error) return { success: false, error: 'فشل في حذف الفرص' };
  return { success: true };
}

export async function bulkToggleOpportunities(ids: string[], isActive: boolean): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  if (profile.role !== 'super_admin') {
    const { data: opps } = await supabase.from('opportunities').select('id, created_by, creator:profiles!created_by(full_name)').in('id', ids);
    if (opps) {
      const notOwned = opps.filter(o => o.created_by !== user.id);
      if (notOwned.length > 0) {
        const names = notOwned.map(o => ((o.creator as unknown) as { full_name: string })?.full_name || 'منسق آخر');
        return { success: false, error: `لا يمكنك ${isActive ? 'تفعيل' : 'إيقاف'} ${notOwned.length} فرصة لأنها من إنشاء: ${names.join('، ')}` };
      }
    }
  }

  const { error } = await supabase.from('opportunities').update({ is_active: isActive, updated_at: new Date().toISOString() }).in('id', ids);
  
  if (!error) {
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action_type: isActive ? 'BULK_ACTIVATE_OPPORTUNITIES' : 'BULK_DEACTIVATE_OPPORTUNITIES',
      description: `تم ${isActive ? 'تفعيل' : 'إيقاف'} ${ids.length} فرصة تطوعية`,
    });
  }

  if (error) return { success: false, error: 'فشل في تحديث حالة الفرص' };
  return { success: true };
}


