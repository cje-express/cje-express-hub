import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/types'
import { NotificationsView } from './NotificationsView'

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    user_id: 'demo-client-001',
    organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-001',
    invoice_id: null,
    title: 'Status atualizado',
    message: 'Sua demanda CJE-20240601-0001 (Audiência — São Paulo/SP) mudou para Em Andamento. Um profissional foi alocado.',
    type: 'status_atualizado',
    is_read: false,
    created_at: '2026-06-15T09:05:00Z',
  },
  {
    id: 'notif-002',
    user_id: 'demo-client-001',
    organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-001',
    invoice_id: null,
    title: 'Valor definido',
    message: 'O valor da demanda CJE-20240601-0001 foi definido: R$ 350,00. Tipo de cobrança: Avulsa.',
    type: 'status_atualizado',
    is_read: false,
    created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'notif-003',
    user_id: 'demo-client-001',
    organization_id: 'demo-org-cliente',
    demand_id: null,
    invoice_id: 'inv-001',
    title: 'Nova fatura disponível',
    message: 'A fatura FAT-2026-0001 no valor de R$ 530,00 foi gerada. Vencimento: 30/06/2026.',
    type: 'fatura_gerada',
    is_read: false,
    created_at: '2026-06-14T14:00:00Z',
  },
  {
    id: 'notif-004',
    user_id: 'demo-client-001',
    organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-001',
    invoice_id: null,
    title: 'Demanda programada',
    message: 'Sua demanda CJE-20240601-0001 (Audiência — São Paulo/SP) foi programada para execução.',
    type: 'status_atualizado',
    is_read: true,
    created_at: '2026-06-14T10:30:00Z',
  },
  {
    id: 'notif-005',
    user_id: 'demo-client-001',
    organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-002',
    invoice_id: null,
    title: 'Solicitação recebida',
    message: 'Sua demanda CJE-20240605-0002 (Protocolos — Santo André/SP) foi recebida. Nossa equipe entrará em contato.',
    type: 'nova_demanda',
    is_read: true,
    created_at: '2026-06-05T14:30:00Z',
  },
  {
    id: 'notif-006',
    user_id: 'demo-client-001',
    organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-003',
    invoice_id: null,
    title: 'Demanda concluída',
    message: 'Sua demanda CJE-20240510-0003 (Diligência no Fórum — SBC/SP) foi concluída. O relatório está disponível.',
    type: 'demanda_concluida',
    is_read: true,
    created_at: '2026-05-15T11:30:00Z',
  },
  {
    id: 'notif-007',
    user_id: 'demo-client-001',
    organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-003',
    invoice_id: null,
    title: 'Documento anexado',
    message: 'Um novo documento foi anexado à demanda CJE-20240510-0003: relatorio_diligencia.pdf',
    type: 'documento_anexado',
    is_read: true,
    created_at: '2026-05-15T11:25:00Z',
  },
  {
    id: 'notif-008',
    user_id: 'demo-client-001',
    organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-002',
    invoice_id: null,
    title: 'Prazo próximo',
    message: 'A demanda CJE-20240605-0002 (Protocolos — Santo André/SP) tem prazo para 20/07/2026. Restam 5 dias.',
    type: 'prazo_proximo',
    is_read: true,
    created_at: '2026-06-15T06:00:00Z',
  },
]

export default async function ClienteNotificacoesPage() {
  const profile = await getServerProfile()

  let notifications: Notification[] = DEMO_NOTIFICATIONS

  if (!IS_DEMO_MODE) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    notifications = (data as Notification[]) ?? []
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return <NotificationsView notifications={notifications} unreadCount={unreadCount} />
}
