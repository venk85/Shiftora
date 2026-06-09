ALTER TABLE learning_modules
  ADD COLUMN IF NOT EXISTS mandatory   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_platform boolean NOT NULL DEFAULT false;
