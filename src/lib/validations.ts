import { z } from 'zod';
import type { NotificationType } from '@/types';

export const OpportunitySchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(100),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  location: z.string().min(2, 'الموقع مطلوب'),
  hours: z.number().positive('الساعات يجب أن تكون رقماً موجباً'),
  requirements: z.string().optional().nullable(),
  max_participants: z.number().positive('العدد يجب أن يكون موجباً').optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

export const ProfileSchema = z.object({
  full_name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  national_id: z.string().length(10, 'الهوية يجب أن تكون 10 أرقام'),
  education_level: z.string().min(2, 'المستوى التعليمي مطلوب'),
  phone: z.string().min(9, 'رقم الجوال غير صحيح'),
});

export const ProfileUpdateSchema = ProfileSchema.partial();
export const OpportunityUpdateSchema = OpportunitySchema.partial();

export const ContentSchema = z.object({
  type: z.enum(['hero_image', 'news', 'achievement', 'stat', 'gallery_image']),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  stat_value: z.string().optional().nullable(),
  stat_label: z.string().optional().nullable(),
  sort_order: z.number().optional(),
  is_published: z.boolean().optional(),
});

export const ContentUpdateSchema = ContentSchema.partial();

export const NotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['opportunity_update', 'application_approved', 'application_rejected', 'certificate_verified', 'system']) as z.ZodType<NotificationType>,
  relatedApplicationId: z.string().optional().nullable(),
});
