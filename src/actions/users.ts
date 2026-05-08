'use server';

import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { ActionResponse, Profile, PaginatedResponse } from '@/types';

export async function getAllUsers(
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Profile[]> & { stats?: any }> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') {
    return { success: false, error: 'غير مصرح' };
  }

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  
  // Stats using exact counts
  const [
    { count: totalCount },
    { count: studentsCount },
    { count: coordinatorsCount },
    { count: adminsCount }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coordinator'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'super_admin')
  ]);

  const stats = {
    total: totalCount || 0,
    students: studentsCount || 0,
    coordinators: coordinatorsCount || 0,
    admins: adminsCount || 0
  };

  if (error) return { success: false, error: 'فشل في تحميل المستخدمين' };
  return { 
    success: true, 
    data: data || [],
    totalCount: count || 0,
    totalPages: count ? Math.ceil(count / limit) : 0,
    currentPage: page,
    stats
  };
}

export async function updateUserRole(
  targetUserId: string,
  newRole: 'student' | 'coordinator'
): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') {
    return { success: false, error: 'غير مصرح - يحق فقط للمشرف العام تغيير الأدوار' };
  }

  // Prevent modifying super_admin
  const { data: targetProfile } = await supabase.from('profiles').select('role').eq('id', targetUserId).single();
  if (targetProfile?.role === 'super_admin') {
    return { success: false, error: 'لا يمكن تعديل دور المشرف العام' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', targetUserId);

  if (!error) {
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action_type: 'UPDATE_ROLE',
      description: `تم تغيير دور المستخدم إلى ${newRole}`,
      target_id: targetUserId
    });

    // Sync role change to Clerk publicMetadata for instant client-side access
    try {
      const client = await clerkClient();
      await client.users.updateUser(targetUserId, {
        publicMetadata: { role: newRole },
      });
    } catch (metaErr) {
      console.error('Failed to update Clerk publicMetadata:', metaErr);
    }
  }

  if (error) return { success: false, error: 'فشل في تحديث الدور' };
  return { success: true };
}

export async function deleteUser(targetUserId: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  if (user.id === targetUserId) {
    return { success: false, error: 'لا يمكنك حذف حسابك الخاص' };
  }

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') {
    return { success: false, error: 'غير مصرح - يحق فقط للمشرف العام حذف الحسابات' };
  }

  try {
    // 1. Delete from Clerk
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const client = await clerkClient();
      await client.users.deleteUser(targetUserId);
    } catch (clerkErr) {
      console.warn('User might already be deleted from Clerk, proceeding with Supabase cleanup...', clerkErr);
    }

    // 2. Delete relations from Supabase to prevent FK constraint failures
    await supabase.from('notifications').delete().eq('user_id', targetUserId);
    
    // Clear created_by in site_content to prevent FK constraint
    await supabase.from('site_content').update({ created_by: null }).eq('created_by', targetUserId);
    
    // Set reviewed_by to null instead of deleting the application
    await supabase.from('applications').update({ verified_by: null }).eq('verified_by', targetUserId);

    // Get all applications this user applied to
    const { data: studentApps } = await supabase.from('applications').select('id').eq('student_id', targetUserId);
    if (studentApps && studentApps.length > 0) {
      const studentAppIds = studentApps.map(a => a.id);
      await supabase.from('notifications').delete().in('related_application_id', studentAppIds);
      await supabase.from('applications').delete().in('id', studentAppIds);
    }

    // Cascade delete applications from opportunities this user created
    const { data: opps } = await supabase.from('opportunities').select('id').eq('created_by', targetUserId);
    if (opps && opps.length > 0) {
      const oppIds = opps.map(o => o.id);
      
      const { data: oppApps } = await supabase.from('applications').select('id').in('opportunity_id', oppIds);
      if (oppApps && oppApps.length > 0) {
        const oppAppIds = oppApps.map(a => a.id);
        await supabase.from('notifications').delete().in('related_application_id', oppAppIds);
      }
      
      await supabase.from('applications').delete().in('opportunity_id', oppIds);
    }

    await supabase.from('opportunities').delete().eq('created_by', targetUserId);

    // 3. Delete profile from Supabase
    const { error } = await supabase.from('profiles').delete().eq('id', targetUserId);
    
    if (error) {
      console.error('Error deleting from supabase:', error);
      // Even if supabase fails, Clerk deleted them so they can't login anyway
    }

    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action_type: 'DELETE_USER',
      description: 'تم حذف حساب مستخدم',
      target_id: targetUserId
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return { success: false, error: 'فشل في حذف المستخدم' };
  }
}
