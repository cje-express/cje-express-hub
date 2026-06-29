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
