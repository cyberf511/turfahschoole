// ============================================================
// Type Definitions — Volunteer Management Platform
// ============================================================

// --- Enums ---

export type UserRole = 'student' | 'coordinator' | 'super_admin';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type CompletionStatus = 'completed_under_review' | 'verified';

export type EducationLevel =
  | 'first_secondary'
  | 'second_secondary'
  | 'third_secondary';

export type NotificationType =
  | 'application_submitted'
  | 'application_approved'
  | 'application_rejected'
  | 'certificate_uploaded'
  | 'certificate_verified';

// --- Database Models ---

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  national_id_encrypted: string | null;
  national_id_last3: string | null;
  education_level: EducationLevel | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  created_by: string;
  title: string;
  description: string;
  location: string;
  hours: number;
  requirements: string | null;
  max_participants: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: Profile;
  application_count?: number;
}

export interface Application {
  id: string;
  opportunity_id: string;
  student_id: string;
  status: ApplicationStatus;
  rejection_reason: string | null;
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  completion_status: CompletionStatus | null;
  certificate_url: string | null;
  certificate_uploaded_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  // Joined fields
  opportunity?: Opportunity;
  student?: Profile;
  reviewer?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  related_application_id: string | null;
  created_at: string;
}

// --- Form Types ---

export interface ProfileFormData {
  full_name: string;
  national_id: string;
  education_level: EducationLevel;
  phone: string;
}

export interface OpportunityFormData {
  title: string;
  description: string;
  location: string;
  hours: number;
  requirements?: string;
  max_participants?: number;
  start_date?: string;
  end_date?: string;
}

// --- UI Types ---

export interface StatsCardData {
  label: string;
  value: number | string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

// --- API Response Types ---

export interface ActionResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ActionResponse<T> {
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
}

// --- Education Level Labels ---

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  first_secondary: 'أول ثانوي',
  second_secondary: 'ثاني ثانوي',
  third_secondary: 'ثالث ثانوي',
};

// --- Status Labels ---

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'معلق',
  approved: 'مقبول',
  rejected: 'مرفوض',
};

export const COMPLETION_STATUS_LABELS: Record<CompletionStatus, string> = {
  completed_under_review: 'قيد المراجعة',
  verified: 'موثق',
};
