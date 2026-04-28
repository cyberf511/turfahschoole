// ============================================================
// Supabase Server Client (for Server Components & Actions)
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createServerSupabase() {
  const { getToken } = await auth();
  const token = await getToken({ template: 'supabase' });

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers },
  });
}
