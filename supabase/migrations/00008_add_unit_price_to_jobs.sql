-- Add unit_price column to jobs table for per-video pricing
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS unit_price integer;
