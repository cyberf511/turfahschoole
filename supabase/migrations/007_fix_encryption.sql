-- ============================================================
-- Fix Encryption — OWASP A02: Cryptographic Failures
-- ============================================================

-- 1. Add national_id_hash column for fast duplicate lookup
ALTER TABLE pre_registered_students
  ADD COLUMN IF NOT EXISTS national_id_hash TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_pre_registered_national_id_hash
  ON pre_registered_students(national_id_hash);

-- 2. Nullify plaintext national_id after encryption backfill
UPDATE pre_registered_students
  SET national_id = NULL
  WHERE national_id_encrypted IS NOT NULL
    AND national_id IS NOT NULL;

-- 3. Drop the index on plaintext national_id (data is nullified)
DROP INDEX IF EXISTS idx_pre_registered_national_id;

-- 4. Drop the old plaintext national_id column (optional, uncomment when ready)
-- ALTER TABLE pre_registered_students DROP COLUMN IF EXISTS national_id;

-- 5. Add verification_code index on applications for fast lookup
CREATE INDEX IF NOT EXISTS idx_applications_verification_code
  ON applications(verification_code)
  WHERE verification_code IS NOT NULL;
