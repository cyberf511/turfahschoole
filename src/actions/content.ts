'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { ContentSchema, ContentUpdateSchema } from '@/lib/validations';
import type { ActionResponse } from '@/types';

export interface SiteContent {
  id: string;
  type: 'hero_image' | 'news' | 'achievement' | 'stat' | 'gallery_image';
  title: string | null;
  description: string | null;
  image_url: string | null;
  stat_value: string | null;
  stat_label: string | null;
  sort_order: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---- PUBLIC (no auth needed) ----

export async function getPublishedContent(): Promise<ActionResponse<SiteContent[]>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) return { success: false, error: 'فشل في تحميل المحتوى' };
  return { success: true, data: data || [] };
}

// ---- COORDINATOR ONLY ----

export async function getAllContent(): Promise<ActionResponse<SiteContent[]>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .order('type')
    .order('sort_order', { ascending: true });

  if (error) return { success: false, error: 'فشل في تحميل المحتوى' };
  return { success: true, data: data || [] };
}

export async function createContent(input: {
  type: SiteContent['type'];
  title?: string;
  description?: string;
  image_url?: string;
  stat_value?: string;
  stat_label?: string;
  sort_order?: number;
}): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const validated = ContentSchema.safeParse(input);
  if (!validated.success) return { success: false, error: 'البيانات غير صالحة' };
  const validData = validated.data;

  const { error } = await supabase.from('site_content').insert({
    type: validData.type,
    title: validData.title || null,
    description: validData.description || null,
    image_url: validData.image_url || null,
    stat_value: validData.stat_value || null,
    stat_label: validData.stat_label || null,
    sort_order: validData.sort_order || 0,
    created_by: user.id,
  });

  if (error) return { success: false, error: 'فشل في إنشاء المحتوى' };
  return { success: true };
}

export async function updateContent(id: string, input: {
  title?: string;
  description?: string;
  image_url?: string;
  stat_value?: string;
  stat_label?: string;
  sort_order?: number;
  is_published?: boolean;
}): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const validated = ContentUpdateSchema.safeParse(input);
  if (!validated.success) return { success: false, error: 'البيانات غير صالحة' };

  const { error } = await supabase
    .from('site_content')
    .update({ ...validated.data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: 'فشل في تحديث المحتوى' };
  return { success: true };
}

export async function deleteContent(id: string): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'coordinator' && profile.role !== 'super_admin')) {
    return { success: false, error: 'غير مصرح' };
  }

  const { error } = await supabase.from('site_content').delete().eq('id', id);
  if (error) return { success: false, error: 'فشل في حذف المحتوى' };
  return { success: true };
}

export async function getContentUploadUrl(fileName: string): Promise<ActionResponse<{ signedUrl: string; path: string }>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const filePath = `site-content/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from('site-content')
    .createSignedUploadUrl(filePath);

  if (error) return { success: false, error: 'فشل في إنشاء رابط الرفع' };
  return { success: true, data: { signedUrl: data.signedUrl, path: filePath } };
}

export async function getContentImageUrl(path: string): Promise<string> {
  const supabase = await createServerSupabase();
  const { data } = supabase.storage.from('site-content').getPublicUrl(path);
  return data.publicUrl;
}
