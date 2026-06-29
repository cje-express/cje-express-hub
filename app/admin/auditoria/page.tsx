import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { formatDateTime } from '@/lib/utils'
import { AuditLogTable } from './AuditLogTable'

const DEMO_AUDIT_LOGS = [
  {
    id: 'log-001', action: 'login', entity_type: 'profiles', entity_id: 'demo-admin-001',
    description: 'Login realizado com sucesso',
    created_at: '2026-06-15T08:00:12Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-002', action: 'create', entity_type: 'demands', entity_id: 'demo-demand-002',
    description: 'Nova demanda criada: Protocolos — Santo André/SP (CJE-20240605-0002)',
    created_at: '2026-06-15T08:15:30Z',
    user: { name: 'João Demo Silva', email: 'cliente@teste.com.br' },
  },
  {
    id: 'log-003', action: 'status_change', entity_type: 'demands', entity_id: 'demo-demand-001',
    description: 'Status alterado: nova_solicitacao → programado (Audiência — São Paulo/SP)',
    created_at: '2026-06-15T09:00:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-004', action: 'upload', entity_type: 'demand_attachments', entity_id: 'att-001',
    description: 'Documento anexado: procuracao.pdf na demanda CJE-20240601-0001',
    created_at: '2026-06-15T09:10:00Z',
    user: { name: 'João Demo Silva', email: 'cliente@teste.com.br' },
  },
  {
    id: 'log-005', action: 'update', entity_type: 'demands', entity_id: 'demo-demand-001',
    description: 'Valor do serviço definido: R$ 350,00 (Audiência — São Paulo/SP)',
    created_at: '2026-06-15T09:30:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-006', action: 'status_change', entity_type: 'demands', entity_id: 'demo-demand-001',
    description: 'Status alterado: programado → em_andamento (Audiência — São Paulo/SP)',
    created_at: '2026-06-15T10:05:00Z',
    user: { name: 'Carlos Operador CJE', email: 'operador@cje.com.br' },
  },
  {
    id: 'log-007', action: 'invoice_create', entity_type: 'invoices', entity_id: 'inv-001',
    description: 'Fatura FAT-2026-0001 gerada para Escritório Demo Advogados — R$ 530,00',
    created_at: '2026-06-14T14:00:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-008', action: 'upload', entity_type: 'invoices', entity_id: 'inv-001',
    description: 'Boleto anexado à fatura FAT-2026-0001',
    created_at: '2026-06-14T14:05:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-009', action: 'login', entity_type: 'profiles', entity_id: 'demo-client-001',
    description: 'Login realizado com sucesso',
    created_at: '2026-06-14T10:00:00Z',
    user: { name: 'João Demo Silva', email: 'cliente@teste.com.br' },
  },
  {
    id: 'log-010', action: 'create', entity_type: 'demands', entity_id: 'demo-demand-001',
    description: 'Nova demanda criada: Audiência — São Paulo/SP (CJE-20240601-0001)',
    created_at: '2026-06-14T10:15:00Z',
    user: { name: 'João Demo Silva', email: 'cliente@teste.com.br' },
  },
  {
    id: 'log-011', action: 'create', entity_type: 'profiles', entity_id: 'demo-op-001',
    description: 'Novo usuário cadastrado: Maria Operadora (Operador Cliente)',
    created_at: '2026-06-13T16:00:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-012', action: 'create', entity_type: 'organizations', entity_id: 'demo-org-cliente',
    description: 'Nova organização cadastrada: Escritório Demo Advogados',
    created_at: '2026-06-13T15:50:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-013', action: 'status_change', entity_type: 'demands', entity_id: 'demo-demand-003',
    description: 'Status alterado: em_andamento → concluido (Diligência no Fórum — SBC/SP)',
    created_at: '2026-06-12T11:30:00Z',
    user: { name: 'Carlos Operador CJE', email: 'operador@cje.com.br' },
  },
  {
    id: 'log-014', action: 'upload', entity_type: 'demand_attachments', entity_id: 'att-003',
    description: 'Relatório final anexado: relatorio_diligencia.pdf na demanda CJE-20240510-0003',
    created_at: '2026-06-12T11:25:00Z',
    user: { name: 'Carlos Operador CJE', email: 'operador@cje.com.br' },
  },
  {
    id: 'log-015', action: 'invoice_paid', entity_type: 'invoices', entity_id: 'inv-002',
    description: 'Pagamento confirmado: Fatura FAT-2026-0002 — R$ 180,00 via PIX',
    created_at: '2026-06-11T09:00:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-016', action: 'update', entity_type: 'profiles', entity_id: 'demo-client-001',
    description: 'Dados do usuário atualizados: João Demo Silva (telefone alterado)',
    created_at: '2026-06-10T14:20:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-017', action: 'cancel', entity_type: 'demands', entity_id: 'demo-demand-old',
    description: 'Demanda cancelada: Cópias — Osasco/SP. Motivo: Cliente desistiu do processo',
    created_at: '2026-06-09T16:45:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-018', action: 'login', entity_type: 'profiles', entity_id: 'demo-op-cje',
    description: 'Login realizado com sucesso',
    created_at: '2026-06-09T08:00:00Z',
    user: { name: 'Carlos Operador CJE', email: 'operador@cje.com.br' },
  },
  {
    id: 'log-019', action: 'archive', entity_type: 'demands', entity_id: 'demo-demand-old-2',
    description: 'Demanda arquivada: Despachos — Guarulhos/SP (CJE-20240410-0015)',
    created_at: '2026-06-08T17:00:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
  {
    id: 'log-020', action: 'delete', entity_type: 'demand_attachments', entity_id: 'att-old',
    description: 'Documento removido: rascunho_errado.pdf da demanda CJE-20240410-0015',
    created_at: '2026-06-08T16:55:00Z',
    user: { name: 'Administrador CJE', email: 'admin@cje.com.br' },
  },
]

export default async function AdminAuditoriaPage() {
  const profile = await getServerProfile()
  if (profile.role !== 'SUPER_ADMIN_CJE') redirect('/admin/dashboard')

  let logs: any[] = DEMO_AUDIT_LOGS

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('audit_logs')
      .select('*, user:profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(200)
    logs = data ?? []
  }

  return <AuditLogTable logs={logs} />
}
