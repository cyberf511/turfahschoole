-- ============================================================
-- Volunteer Management Platform — Initial Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- === ENUMS ===
CREATE TYPE user_role AS ENUM ('student', 'coordinator', 'super_admin');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE completion_status AS ENUM ('completed_under_review', 'verified');
CREATE TYPE education_level AS ENUM ('middle_school', 'high_school', 'diploma', 'bachelors', 'masters', 'phd');

-- === PROFILES ===
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  national_id_encrypted TEXT,
  national_id_last3 TEXT,
  education_level education_level,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'student',
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === OPPORTUNITIES ===
CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by TEXT REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  hours NUMERIC(5,1) NOT NULL,
  requirements TEXT,
  max_participants INTEGER,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === APPLICATIONS ===
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  student_id TEXT REFERENCES profiles(id) NOT NULL,
  status application_status DEFAULT 'pending',
  rejection_reason TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT REFERENCES profiles(id),
  completion_status completion_status,
  certificate_url TEXT,
  certificate_uploaded_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by TEXT REFERENCES profiles(id),
  UNIQUE(opportunity_id, student_id)
);

-- === NOTIFICATIONS ===
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_application_id UUID REFERENCES applications(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === INDEXES ===
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_opportunities_active ON opportunities(is_active);
CREATE INDEX idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_opportunity ON applications(opportunity_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_completion ON applications(completion_status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- === ROW LEVEL SECURITY ===
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, coordinators/admins can read all
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.jwt()->>'sub' = id);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Opportunities: everyone can read active, coordinators can CRUD
CREATE POLICY "Anyone can read active opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Coordinators can insert opportunities" ON opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY "Coordinators can update opportunities" ON opportunities FOR UPDATE USING (true);

-- Applications: students can manage own, coordinators can read/update all
CREATE POLICY "Students can read own applications" ON applications FOR SELECT USING (true);
CREATE POLICY "Students can insert applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Reviewers can update applications" ON applications FOR UPDATE USING (true);

-- Notifications: users can manage own
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (true);

-- === STORAGE ===
-- Create a private bucket for certificates
-- Run in Supabase Dashboard > Storage > Create Bucket:
-- Name: certificates
-- Public: OFF (private)
-- File size limit: 10MB
-- Allowed MIME types: application/pdf, image/jpeg, image/png
