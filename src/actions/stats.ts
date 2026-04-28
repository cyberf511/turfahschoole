'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';

export async function getCoordinatorStats(): Promise<ActionResponse<{ opportunities: number, pendingApps: number, pendingCerts: number, totalApps: number }>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  try {
    const [
      { count: opportunities },
      { count: pendingApps },
      { count: pendingCerts },
      { count: totalApps }
    ] = await Promise.all([
      supabase.from('opportunities').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).not('certificate_url', 'is', null).eq('completion_status', 'completed_under_review'),
      supabase.from('applications').select('*', { count: 'exact', head: true })
    ]);

    return {
      success: true,
      data: {
        opportunities: opportunities || 0,
        pendingApps: pendingApps || 0,
        pendingCerts: pendingCerts || 0,
        totalApps: totalApps || 0,
      }
    };
  } catch (error) {
    return { success: false, error: 'فشل في تحميل الإحصائيات' };
  }
}
