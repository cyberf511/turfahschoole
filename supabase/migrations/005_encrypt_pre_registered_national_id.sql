-- ============================================================
-- Encrypt pre_registered_students national_id
-- Add encrypted column + last3 for display
-- ============================================================

ALTER TABLE pre_registered_students ADD COLUMN IF NOT EXISTS national_id_encrypted TEXT;
ALTER TABLE pre_registered_students ADD COLUMN IF NOT EXISTS national_id_last3 TEXT;

-- Backfill: if national_id exists, copy last3 (full encryption happens server-side)
UPDATE pre_registered_students
SET national_id_last3 = RIGHT(national_id, 3)
WHERE national_id IS NOT NULL AND national_id_last3 IS NULL;

-- Add index for lookup during webhook
CREATE INDEX IF NOT EXISTS idx_pre_registered_national_id ON pre_registered_students(national_id);
