-- Add new secondary school education levels
-- Keep old values for backward compatibility with existing records

ALTER TYPE education_level ADD VALUE IF NOT EXISTS 'first_secondary';
ALTER TYPE education_level ADD VALUE IF NOT EXISTS 'second_secondary';
ALTER TYPE education_level ADD VALUE IF NOT EXISTS 'third_secondary';
