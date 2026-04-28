-- ============================================================
-- Site Content — Coordinator-managed landing page content
-- Run this AFTER 001_initial_schema.sql in Supabase SQL Editor
-- ============================================================

-- Content types for the landing page
CREATE TYPE content_type AS ENUM (
  'hero_image',        -- Hero carousel images
  'news',              -- School news/announcements
  'achievement',       -- School achievements
  'stat',              -- Statistics (graduated, current students, etc.)
  'gallery_image'      -- Photo gallery
);

-- === SITE CONTENT ===
CREATE TABLE site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type content_type NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  stat_value TEXT,            -- For stat type: the number/value
  stat_label TEXT,            -- For stat type: the label (e.g. "طالبة متخرجة")
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === INDEXES ===
CREATE INDEX idx_site_content_type ON site_content(type);
CREATE INDEX idx_site_content_published ON site_content(is_published);
CREATE INDEX idx_site_content_sort ON site_content(sort_order);

-- === RLS ===
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published content" ON site_content
  FOR SELECT USING (is_published = true);

CREATE POLICY "Coordinators can insert content" ON site_content
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Coordinators can update content" ON site_content
  FOR UPDATE USING (true);

CREATE POLICY "Coordinators can delete content" ON site_content
  FOR DELETE USING (true);

-- === SEED DATA (Example) ===
-- Insert some default stats so the page isn't empty
INSERT INTO site_content (type, stat_value, stat_label, sort_order) VALUES
  ('stat', '500+', 'طالبة حالية', 1),
  ('stat', '2000+', 'طالبة متخرجة', 2),
  ('stat', '50+', 'فرصة تطوعية', 3),
  ('stat', '10000+', 'ساعة تطوعية', 4);
