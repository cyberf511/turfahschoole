import { z } from 'zod';
import type { NotificationType } from '@/types';

export const OpportunitySchema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل').max(100, 'العنوان طويل جداً'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل').max(5000, 'الوصف طويل جداً'),
  location: z.string().min(2, 'الموقع مطلوب').max(200, 'الموقع طويل جداً'),
  hours: z.number().positive('الساعات يجب أن تكون رقماً موجباً').max(9999, 'الساعات كبيرة جداً'),
  requirements: z.string().max(5000, 'المتطلبات طويلة جداً').optional().nullable(),
  max_participants: z.number().positive('العدد يجب أن يكون موجباً').max(999999, 'العدد كبير جداً').optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

export const ProfileSchema = z.object({
  full_name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل').max(100, 'الاسم طويل جداً'),
  national_id: z.string().length(10, 'الهوية يجب أن تكون 10 أرقام').regex(/^\d{10}$/, 'الهوية يجب أن تحتوي على أرقام فقط'),
  education_level: z.string().min(2, 'المستوى التعليمي مطلوب').max(50, 'المستوى التعليمي طويل جداً'),
  phone: z.string().min(9, 'رقم الجوال غير صحيح').max(20, 'رقم الجوال طويل جداً'),
});

export const ProfileUpdateSchema = ProfileSchema.partial();
export const OpportunityUpdateSchema = OpportunitySchema.partial();

export const ContentSchema = z.object({
  type: z.enum(['hero_image', 'news', 'achievement', 'stat', 'gallery_image']),
  title: z.string().max(500, 'العنوان طويل جداً').optional().nullable(),
  description: z.string().max(5000, 'الوصف طويل جداً').optional().nullable(),
  image_url: z.string().url('رابط الصورة غير صالح').refine(val => /^https?:\/\//i.test(val || ''), 'رابط الصورة يجب أن يبدأ بـ https://').optional().nullable().or(z.literal('')),
  stat_value: z.string().max(100).optional().nullable(),
  stat_label: z.string().max(100).optional().nullable(),
  sort_order: z.number().optional(),
  is_published: z.boolean().optional(),
});

export const ContentUpdateSchema = ContentSchema.partial();

const NOTIFICATION_TYPES = ['application_submitted', 'application_approved', 'application_rejected', 'certificate_uploaded', 'certificate_verified'] as const;

export const NotificationSchema = z.object({
  userId: z.string().min(1, 'معرف المستخدم مطلوب'),
  title: z.string().min(1, 'العنوان مطلوب').max(200, 'العنوان طويل جداً'),
  message: z.string().min(1, 'الرسالة مطلوبة').max(2000, 'الرسالة طويلة جداً'),
  type: z.enum(NOTIFICATION_TYPES) as z.ZodType<NotificationType>,
  relatedApplicationId: z.string().optional().nullable(),
});

export const PreRegisteredStudentSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  full_name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل').max(100, 'الاسم طويل جداً'),
  national_id: z.string().length(10, 'رقم الهوية يجب أن يكون 10 أرقام').regex(/^\d{10}$/, 'رقم الهوية يجب أن يحتوي على أرقام فقط'),
  phone: z.string().optional().nullable(),
  education_level: z.string().optional().nullable(),
});
