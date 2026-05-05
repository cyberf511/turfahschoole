-- ============================================================
-- Add verification_code for certificates
-- Prevents enumeration of certificates via UUID guessing
-- ============================================================

ALTER TABLE applications ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE;

-- Generate verification codes for existing verified certificates
UPDATE applications
SET verification_code = SUBSTRING(MD5(id::TEXT || verified_at::TEXT) FOR 12)
WHERE completion_status = 'verified' AND verification_code IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_applications_verification_code ON applications(verification_code);
