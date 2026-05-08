-- ============================================================
-- Fix Verification Codes — OWASP A02: Cryptographic Failures
-- Use gen_random_bytes instead of MD5 for unpredictable codes
-- ============================================================

-- Update existing null verification codes with random values
UPDATE applications
  SET verification_code = UPPER(ENCODE(GEN_RANDOM_BYTES(8), 'hex'))
  WHERE verification_code IS NULL
    AND completion_status = 'verified';
