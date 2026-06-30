-- Garante que client_notes existe na tabela demands
-- Safe to run even if column already exists
ALTER TABLE demands ADD COLUMN IF NOT EXISTS client_notes TEXT;
