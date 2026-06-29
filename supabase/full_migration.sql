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
-- ============================================================
-- CJE Express Hub — Migração 002: Row Level Security
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_audience_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Funções auxiliares de RLS
-- ============================================================

-- Retorna o profile do usuário autenticado
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS profiles AS $$
  SELECT * FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Retorna o role do usuário autenticado
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Retorna o organization_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se é admin CJE
CREATE OR REPLACE FUNCTION is_cje_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('SUPER_ADMIN_CJE', 'OPERADOR_CJE');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se é super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() = 'SUPER_ADMIN_CJE';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Políticas: organizations
-- ============================================================

-- Admin CJE vê tudo
CREATE POLICY "cje_admin_can_read_organizations" ON organizations
  FOR SELECT TO authenticated
  USING (is_cje_admin());

-- Cliente vê apenas a própria org
CREATE POLICY "client_can_read_own_organization" ON organizations
  FOR SELECT TO authenticated
  USING (id = get_my_org_id() AND NOT is_cje_admin());

-- Apenas super admin cria/edita organizations
CREATE POLICY "super_admin_can_manage_organizations" ON organizations
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================
-- Políticas: profiles
-- ============================================================

-- Usuário vê próprio profile
CREATE POLICY "user_can_read_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Admin CJE vê todos os profiles
CREATE POLICY "cje_admin_can_read_all_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (is_cje_admin());

-- Admin cliente vê profiles da própria organização
CREATE POLICY "client_admin_can_read_org_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    organization_id = get_my_org_id()
    AND get_my_role() IN ('ADMIN_CLIENTE', 'OPERADOR_CLIENTE')
  );

-- Super admin gerencia todos os profiles
CREATE POLICY "super_admin_can_manage_profiles" ON profiles
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admin cliente gerencia profiles da própria org (sem criar CJE)
CREATE POLICY "client_admin_can_manage_org_profiles" ON profiles
  FOR ALL TO authenticated
  USING (
    organization_id = get_my_org_id()
    AND get_my_role() = 'ADMIN_CLIENTE'
    AND role NOT IN ('SUPER_ADMIN_CJE', 'OPERADOR_CJE')
  )
  WITH CHECK (
    organization_id = get_my_org_id()
    AND get_my_role() = 'ADMIN_CLIENTE'
    AND role NOT IN ('SUPER_ADMIN_CJE', 'OPERADOR_CJE')
  );

-- Usuário atualiza próprio profile
CREATE POLICY "user_can_update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid() AND role = (SELECT role FROM profiles WHERE auth_user_id = auth.uid()));

-- ============================================================
-- Políticas: demands
-- ============================================================

-- Admin CJE vê todas as demandas
CREATE POLICY "cje_admin_can_read_all_demands" ON demands
  FOR SELECT TO authenticated
  USING (is_cje_admin() AND deleted_at IS NULL);

-- Cliente vê apenas demandas da própria organização
CREATE POLICY "client_can_read_own_org_demands" ON demands
  FOR SELECT TO authenticated
  USING (
    organization_id = get_my_org_id()
    AND NOT is_cje_admin()
    AND deleted_at IS NULL
  );

-- Super admin gerencia todas as demandas
CREATE POLICY "super_admin_can_manage_demands" ON demands
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Cliente cria demandas
CREATE POLICY "client_can_create_demands" ON demands
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_my_org_id()
    AND NOT is_cje_admin()
    AND created_by_user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- ============================================================
-- Políticas: demand_audience_details
-- ============================================================

CREATE POLICY "read_audience_details" ON demand_audience_details
  FOR SELECT TO authenticated
  USING (
    is_cje_admin()
    OR demand_id IN (
      SELECT id FROM demands WHERE organization_id = get_my_org_id() AND deleted_at IS NULL
    )
  );

CREATE POLICY "super_admin_manage_audience_details" ON demand_audience_details
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "client_can_create_audience_details" ON demand_audience_details
  FOR INSERT TO authenticated
  WITH CHECK (
    demand_id IN (
      SELECT id FROM demands
      WHERE organization_id = get_my_org_id()
      AND created_by_user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
    )
  );

-- ============================================================
-- Políticas: demand_attachments
-- ============================================================

CREATE POLICY "read_demand_attachments" ON demand_attachments
  FOR SELECT TO authenticated
  USING (
    -- Admin CJE vê tudo
    is_cje_admin()
    -- Cliente vê anexos da própria org com visibilidade correta
    OR (
      demand_id IN (
        SELECT id FROM demands WHERE organization_id = get_my_org_id()
      )
      AND visibility = 'client_and_admin'
    )
  );

CREATE POLICY "super_admin_manage_attachments" ON demand_attachments
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "client_can_upload_attachments" ON demand_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    demand_id IN (
      SELECT id FROM demands WHERE organization_id = get_my_org_id()
    )
    AND NOT is_cje_admin()
    AND category = 'client_document'
    AND visibility = 'client_and_admin'
  );

-- ============================================================
-- Políticas: demand_comments
-- ============================================================

CREATE POLICY "read_demand_comments" ON demand_comments
  FOR SELECT TO authenticated
  USING (
    is_cje_admin()
    OR (
      demand_id IN (
        SELECT id FROM demands WHERE organization_id = get_my_org_id()
      )
      AND visibility = 'client_visible'
    )
  );

CREATE POLICY "super_admin_manage_comments" ON demand_comments
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================
-- Políticas: invoices
-- ============================================================

CREATE POLICY "cje_admin_read_all_invoices" ON invoices
  FOR SELECT TO authenticated
  USING (is_cje_admin());

CREATE POLICY "client_read_own_invoices" ON invoices
  FOR SELECT TO authenticated
  USING (organization_id = get_my_org_id() AND NOT is_cje_admin());

CREATE POLICY "super_admin_manage_invoices" ON invoices
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================
-- Políticas: invoice_items
-- ============================================================

CREATE POLICY "read_invoice_items" ON invoice_items
  FOR SELECT TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE
        is_cje_admin() OR organization_id = get_my_org_id()
    )
  );

CREATE POLICY "super_admin_manage_invoice_items" ON invoice_items
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================
-- Políticas: financial_documents
-- ============================================================

CREATE POLICY "read_financial_documents" ON financial_documents
  FOR SELECT TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE
        is_cje_admin() OR organization_id = get_my_org_id()
    )
  );

CREATE POLICY "super_admin_manage_financial_docs" ON financial_documents
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================
-- Políticas: notifications
-- ============================================================

CREATE POLICY "user_read_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "user_update_own_notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "super_admin_manage_notifications" ON notifications
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ============================================================
-- Políticas: audit_logs
-- ============================================================

-- Apenas admin CJE vê logs de auditoria
CREATE POLICY "cje_admin_read_audit_logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (is_cje_admin());

-- Service role insere logs (via API)
CREATE POLICY "service_role_insert_audit_logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);
-- ============================================================
-- CJE Express Hub — Migração 003: Dados iniciais (seed)
-- ============================================================
-- ATENÇÃO: Execute este seed APÓS criar o usuário admin no Supabase Auth
-- e substitua o UUID abaixo pelo auth.uid() gerado

-- Organização CJE Express (interna)
INSERT INTO organizations (id, type, name, corporate_name, cnpj_cpf, email, phone, city, state, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'interno',
  'CJE Express',
  'CJE SERVICOS DE APOIO ADMNISTRATIVO LTDA',
  '54.787.995/0001-01',
  'contato@cjeexpress.com.br',
  '+55 11 98213-1799',
  'São Bernardo do Campo',
  'SP',
  'active'
);

-- Organizações clientes fictícias
INSERT INTO organizations (id, type, name, corporate_name, cnpj_cpf, email, phone, city, state, status)
VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    'escritorio_advocacia',
    'Almeida & Costa Advocacia',
    'Almeida & Costa Advogados Associados LTDA',
    '12.345.678/0001-90',
    'contato@almeidacosta.adv.br',
    '(11) 3333-4444',
    'São Paulo',
    'SP',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'empresa_juridico',
    'Jurídico Empresa Beta',
    'Beta Soluções Empresariais LTDA',
    '98.765.432/0001-10',
    'juridico@empresabeta.com.br',
    '(11) 5555-6666',
    'São Paulo',
    'SP',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'imobiliaria',
    'Imobiliária Central SP',
    'Central SP Negócios Imobiliários LTDA',
    '45.678.901/0001-23',
    'juridico@centralsp.com.br',
    '(11) 7777-8888',
    'São Paulo',
    'SP',
    'active'
  );

-- ============================================================
-- NOTA: O perfil do admin deve ser criado após registrar o
-- usuário via Supabase Auth. Use a função abaixo como referência:
--
-- INSERT INTO profiles (auth_user_id, organization_id, name, email, role)
-- VALUES (
--   '<UUID do auth.users>',
--   '00000000-0000-0000-0000-000000000001',
--   'Administrador CJE',
--   'admin@cjeexpress.com.br',
--   'SUPER_ADMIN_CJE'
-- );
-- ============================================================

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_organization_id UUID,
  p_demand_id UUID,
  p_invoice_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type notification_type
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, organization_id, demand_id, invoice_id, title, message, type)
  VALUES (p_user_id, p_organization_id, p_demand_id, p_invoice_id, p_title, p_message, p_type)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar número de protocolo único
CREATE OR REPLACE FUNCTION generate_protocol_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_seq INT;
  v_protocol TEXT;
BEGIN
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(protocol_number, '-', 3) AS INT)
  ), 0) + 1
  INTO v_seq
  FROM demands
  WHERE protocol_number LIKE 'CJE-' || v_date || '-%';

  v_protocol := 'CJE-' || v_date || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN v_protocol;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para inserir audit log
CREATE OR REPLACE FUNCTION insert_audit_log(
  p_user_id UUID,
  p_organization_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_action TEXT,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, organization_id, entity_type, entity_id,
    action, old_data, new_data, ip_address, user_agent
  )
  VALUES (
    p_user_id, p_organization_id, p_entity_type, p_entity_id,
    p_action, p_old_data, p_new_data, p_ip_address, p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar número de fatura
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(invoice_number, '-', 2) AS INT)
  ), 0) + 1
  INTO v_seq
  FROM invoices
  WHERE invoice_number LIKE 'FAT-' || v_year || '-%';

  RETURN 'FAT-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
