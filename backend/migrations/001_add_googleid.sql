-- Migration: add GoogleID column to operators table
-- Run this against the `factory_db` database.
-- It safely adds the column if it doesn't exist.

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS GoogleID VARCHAR(255) NULL;

-- Optional: make GoogleID unique (uncomment to enable)
-- Note: ensure there are no duplicate values before adding UNIQUE constraint.
-- ALTER TABLE operators
--   ADD UNIQUE INDEX uq_operators_googleid (GoogleID);
