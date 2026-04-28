'use server';

import { currentUser } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { encrypt, getLastThreeDigits } from '@/lib/encryption';
import { ProfileSchema, ProfileUpdateSchema } from '@/lib/validations';
import type { ActionResponse, ProfileFormData, Profile } from '@/types';

export async function getProfile(): Promise<ActionResponse<Profile>> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // If not found, create a minimal profile
    if (error.code === 'PGRST116') {
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
      const email = user.emailAddresses[0]?.emailAddress || '';
      const role = email.toLowerCase() === superAdminEmail ? 'super_admin' : 'student';

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email,
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
          avatar_url: user.imageUrl || null,
          role,
          profile_completed: false,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (createError) return { success: false, error: 'فشل في إنشاء الملف الشخصي' };
      return { success: true, data: newProfile };
    }
    return { success: false, error: 'فشل في تحميل الملف الشخصي' };
  }

  return { success: true, data };
}

export async function completeProfile(formData: ProfileFormData): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();

  const validated = ProfileSchema.safeParse(formData);
  if (!validated.success) return { success: false, error: 'البيانات غير صالحة' };
  const validData = validated.data;

  const encryptedNationalId = encrypt(validData.national_id);
  const last3 = getLastThreeDigits(validData.national_id);

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: validData.full_name,
      national_id_encrypted: encryptedNationalId,
      national_id_last3: last3,
      education_level: validData.education_level,
      phone: validData.phone,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { success: false, error: 'فشل في حفظ البيانات' };
  return { success: true };
}

export async function updateProfile(data: Partial<ProfileFormData>): Promise<ActionResponse> {
  const user = await currentUser();
  if (!user) return { success: false, error: 'غير مصرح' };

  const supabase = await createServerSupabase();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const validated = ProfileUpdateSchema.safeParse(data);
  if (!validated.success) return { success: false, error: 'البيانات غير صالحة' };
  const validData = validated.data;

  if (validData.full_name) updateData.full_name = validData.full_name;
  if (validData.phone) updateData.phone = validData.phone;
  if (validData.education_level) updateData.education_level = validData.education_level;
  if (validData.national_id) {
    updateData.national_id_encrypted = encrypt(validData.national_id);
    updateData.national_id_last3 = getLastThreeDigits(validData.national_id);
  }

  const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id);
  if (error) return { success: false, error: 'فشل في تحديث البيانات' };
  return { success: true };
}
