import { getServerProfile } from '@/lib/server-session'
import { IS_DEMO_MODE } from '@/lib/demo'
import { createClient } from '@/lib/supabase/server'
import { NotificationsView } from '@/components/NotificationsView'
import type { Notification } from '@/types'

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001', user_id: 'demo-client-001', organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-001', invoice_id: null,
    title: 'Status atualizado', type: 'status_atualizado', is_read: false,
    message: 'Sua demanda CJE-20240601-0001 (Audiência — São Paulo/SP) mudou para Em Andamento.',
    created_at: '2026-06-15T09:05:00Z',
  },
  {
    id: 'notif-002', user_id: 'demo-client-001', organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-001', invoice_id: null,
    title: 'Valor definido', type: 'status_atualizado', is_read: false,
    message: 'O valor da demanda CJE-20240601-0001 foi definido: R$ 350,00.',
    created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'notif-003', user_id: 'demo-client-001', organization_id: 'demo-org-cliente',
    demand_id: null, invoice_id: 'inv-001',
    title: 'Nova fatura disponível', type: 'fatura_gerada', is_read: false,
    message: 'A fatura FAT-2026-0001 no valor de R$ 530,00 foi gerada. Vencimento: 30/06/2026.',
    created_at: '2026-06-14T14:00:00Z',
  },
  {
    id: 'notif-004', user_id: 'demo-client-001', organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-001', invoice_id: null,
    title: 'Demanda programada', type: 'status_atualizado', is_read: true,
    message: 'Sua demanda CJE-20240601-0001 (Audiência — São Paulo/SP) foi programada para execução.',
    created_at: '2026-06-14T10:30:00Z',
  },
  {
    id: 'notif-005', user_id: 'demo-client-001', organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-002', invoice_id: null,
    title: 'Solicitação recebida', type: 'nova_demanda', is_read: true,
    message: 'Sua demanda CJE-20240605-0002 (Protocolos — Santo André/SP) foi recebida.',
    created_at: '2026-06-05T14:30:00Z',
  },
  {
    id: 'notif-006', user_id: 'demo-client-001', organization_id: 'demo-org-cliente',
    demand_id: 'demo-demand-003', invoice_id: null,
    title: 'Demanda concluída', type: 'demanda_concluida', is_read: true,
    message: 'Sua demanda CJE-20240510-0003 (Diligência no Fórum — SBC/SP) foi concluída.',
    created_at: '2026-05-15T11:30:00Z',
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

  return <NotificationsView notifications={notifications} isAdmin={false} />
}
