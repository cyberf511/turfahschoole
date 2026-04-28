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
    const { data: rpcStats, error } = await supabase.rpc('get_coordinator_stats');
    if (error) throw error;

    return {
      success: true,
      data: {
        opportunities: rpcStats?.opportunities || 0,
        pendingApps: rpcStats?.pendingApps || 0,
        pendingCerts: rpcStats?.pendingCerts || 0,
        totalApps: rpcStats?.totalApps || 0,
      }
    };
  } catch (error) {
    return { success: false, error: 'فشل في تحميل الإحصائيات' };
  }
}
