-- ============================================================
-- CJE Express Hub — Migração 001: Criação das tabelas
-- ============================================================

-- Enums
CREATE TYPE organization_type AS ENUM (
  'escritorio_advocacia', 'empresa_juridico', 'advogado_autonomo',
  'imobiliaria', 'pessoa_fisica', 'outro', 'interno'
);

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN_CJE', 'OPERADOR_CJE', 'ADMIN_CLIENTE', 'OPERADOR_CLIENTE'
);

CREATE TYPE user_status AS ENUM ('active', 'inactive');

CREATE TYPE demand_status AS ENUM (
  'nova_solicitacao', 'programado', 'em_andamento',
  'concluido', 'arquivado', 'cancelado'
);

CREATE TYPE demand_type AS ENUM (
  'audiencia', 'acompanhamentos', 'diligencia_forum',
  'despachos', 'protocolos', 'copias', 'outros'
);

CREATE TYPE demand_urgency AS ENUM ('normal', 'urgente');

CREATE TYPE billing_type AS ENUM ('mensal', 'avulsa');

CREATE TYPE charge_to_type AS ENUM ('organization', 'terceiro');

CREATE TYPE demand_source AS ENUM ('manual', 'client_form', 'ai_assistant');

CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'overdue', 'canceled');

CREATE TYPE payment_method AS ENUM (
  'pix', 'boleto', 'transferencia', 'nf_pagamento_externo', 'externo'
);

CREATE TYPE attachment_category AS ENUM (
  'client_document', 'admin_document', 'final_report',
  'certificate', 'proof', 'invoice', 'boleto', 'other'
);

CREATE TYPE attachment_visibility AS ENUM ('client_and_admin', 'admin_only');

CREATE TYPE financial_doc_category AS ENUM (
  'nota_fiscal', 'boleto', 'comprovante', 'resumo_demandas', 'outro'
);

CREATE TYPE notification_type AS ENUM (
  'nova_demanda', 'status_atualizado', 'demanda_concluida',
  'prazo_proximo', 'fatura_gerada', 'documento_anexado', 'sistema'
);

CREATE TYPE comment_visibility AS ENUM ('internal', 'client_visible');

CREATE TYPE hearing_area AS ENUM ('trabalhista', 'civel', 'criminal', 'tributaria');

CREATE TYPE hearing_type AS ENUM (
  'conciliacao', 'inicial', 'instrucao', 'una', 'julgamento'
);

CREATE TYPE hearing_format AS ENUM ('presencial', 'virtual');

CREATE TYPE required_professional AS ENUM (
  'somente_advogado', 'somente_preposto', 'advogado_e_preposto',
  'advogado', 'correspondente'
);

-- ============================================================
-- Tabela: organizations
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type organization_type NOT NULL DEFAULT 'outro',
  name TEXT NOT NULL,
  corporate_name TEXT,
  cnpj_cpf TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- Tabela: profiles
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'OPERADOR_CLIENTE',
  status user_status NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  UNIQUE(auth_user_id)
);

-- ============================================================
-- Tabela: demands
-- ============================================================
CREATE TABLE demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_number TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by_user_id UUID NOT NULL REFERENCES profiles(id),
  assigned_admin_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  demand_type demand_type NOT NULL,
  other_demand_type TEXT,
  status demand_status NOT NULL DEFAULT 'nova_solicitacao',
  urgency demand_urgency DEFAULT 'normal',
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  service_location TEXT,
  deadline_date DATE,
  deadline_time TIME,
  process_number TEXT,
  required_professional required_professional,
  instructions TEXT,
  admin_notes TEXT,
  client_notes TEXT,
  service_value DECIMAL(10,2),
  billing_type billing_type,
  charge_to charge_to_type DEFAULT 'organization',
  charge_to_name TEXT,
  is_value_confirmed_externally BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  demand_source demand_source NOT NULL DEFAULT 'client_form',
  ai_generated_data JSONB,
  ai_reviewed_by_client BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- Tabela: demand_audience_details
-- ============================================================
CREATE TABLE demand_audience_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  hearing_area hearing_area NOT NULL,
  hearing_type hearing_type NOT NULL,
  hearing_format hearing_format NOT NULL,
  hearing_datetime TIMESTAMPTZ,
  process_number TEXT,
  required_professional required_professional,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  service_location TEXT,
  additional_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(demand_id)
);

-- ============================================================
-- Tabela: demand_attachments
-- ============================================================
CREATE TABLE demand_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category attachment_category NOT NULL DEFAULT 'client_document',
  visibility attachment_visibility NOT NULL DEFAULT 'client_and_admin',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabela: demand_comments
-- ============================================================
CREATE TABLE demand_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  visibility comment_visibility NOT NULL DEFAULT 'internal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabela: invoices
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  invoice_number TEXT NOT NULL UNIQUE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  payment_method payment_method,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  asaas_payment_id TEXT,
  notes TEXT,
  external_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabela: invoice_items
-- ============================================================
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  demand_id UUID REFERENCES demands(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabela: financial_documents
-- ============================================================
CREATE TABLE financial_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category financial_doc_category NOT NULL DEFAULT 'outro',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabela: notifications
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  demand_id UUID REFERENCES demands(id),
  invoice_id UUID REFERENCES invoices(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'sistema',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabela: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  organization_id UUID REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_demands_organization_id ON demands(organization_id);
CREATE INDEX idx_demands_status ON demands(status);
CREATE INDEX idx_demands_created_at ON demands(created_at DESC);
CREATE INDEX idx_demands_deadline_date ON demands(deadline_date);
CREATE INDEX idx_demand_attachments_demand_id ON demand_attachments(demand_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ============================================================
-- Funções de updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_demands_updated_at
  BEFORE UPDATE ON demands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_demand_audience_details_updated_at
  BEFORE UPDATE ON demand_audience_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
