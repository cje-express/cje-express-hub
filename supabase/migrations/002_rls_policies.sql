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
