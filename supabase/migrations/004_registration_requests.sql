-- ============================================================
-- CJE Express Hub — Migração 004: Solicitações de cadastro
-- ============================================================

-- Adiciona tipo 'novo_cadastro' ao enum (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'notification_type'::regtype
      AND enumlabel = 'novo_cadastro'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'novo_cadastro';
  END IF;
END $$;

-- Tabela de solicitações de cadastro (vindas da landing page)
CREATE TABLE IF NOT EXISTS registration_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT,
  email        TEXT NOT NULL,
  phone        TEXT,
  comarca      TEXT,
  info         TEXT,
  status       TEXT NOT NULL DEFAULT 'pendente',  -- pendente | em_analise | aprovado | recusado
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: apenas super admin e operadores CJE podem gerenciar
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CJE admins can manage registration requests"
  ON registration_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_user_id = auth.uid()
        AND role IN ('SUPER_ADMIN_CJE', 'OPERADOR_CJE')
    )
  );

-- Index para facilitar buscas por status
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_requests_created_at ON registration_requests(created_at DESC);
