export type UserRole =
  | 'SUPER_ADMIN_CJE'
  | 'OPERADOR_CJE'
  | 'ADMIN_CLIENTE'
  | 'OPERADOR_CLIENTE'

export type OrganizationType =
  | 'escritorio_advocacia'
  | 'empresa_juridico'
  | 'advogado_autonomo'
  | 'imobiliaria'
  | 'pessoa_fisica'
  | 'outro'
  | 'interno'

export type DemandStatus =
  | 'nova_solicitacao'
  | 'programado'
  | 'em_andamento'
  | 'concluido'
  | 'arquivado'
  | 'cancelado'

export type DemandType =
  | 'audiencia'
  | 'acompanhamentos'
  | 'diligencia_forum'
  | 'despachos'
  | 'protocolos'
  | 'copias'
  | 'outros'

export type DemandUrgency = 'normal' | 'urgente'

export type BillingType = 'mensal' | 'avulsa'

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'overdue' | 'canceled'

export type PaymentMethod =
  | 'pix'
  | 'boleto'
  | 'transferencia'
  | 'nf_pagamento_externo'
  | 'externo'

export type AttachmentCategory =
  | 'client_document'
  | 'admin_document'
  | 'final_report'
  | 'certificate'
  | 'proof'
  | 'invoice'
  | 'boleto'
  | 'other'

export type NotificationType =
  | 'nova_demanda'
  | 'status_atualizado'
  | 'demanda_concluida'
  | 'prazo_proximo'
  | 'fatura_gerada'
  | 'documento_anexado'
  | 'sistema'

export type HearingArea = 'trabalhista' | 'civel' | 'criminal' | 'tributaria'

export type HearingType =
  | 'conciliacao'
  | 'inicial'
  | 'instrucao'
  | 'una'
  | 'julgamento'

export type HearingFormat = 'presencial' | 'virtual'

export type RequiredProfessional =
  | 'somente_advogado'
  | 'somente_preposto'
  | 'advogado_e_preposto'
  | 'advogado'
  | 'correspondente'

export interface Organization {
  id: string
  type: OrganizationType
  name: string
  corporate_name: string | null
  cnpj_cpf: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Profile {
  id: string
  auth_user_id: string
  organization_id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  status: 'active' | 'inactive'
  avatar_url: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
  organization?: Organization
}

export interface Demand {
  id: string
  protocol_number: string
  organization_id: string
  created_by_user_id: string
  assigned_admin_id: string | null
  title: string
  demand_type: DemandType
  other_demand_type: string | null
  status: DemandStatus
  urgency: DemandUrgency | null
  city: string
  state: string
  service_location: string | null
  deadline_date: string | null
  deadline_time: string | null
  process_number: string | null
  required_professional: RequiredProfessional | null
  instructions: string | null
  admin_notes: string | null
  client_notes: string | null
  service_value: number | null
  billing_type: BillingType | null
  charge_to: 'organization' | 'terceiro' | null
  charge_to_name: string | null
  is_value_confirmed_externally: boolean
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  archived_at: string | null
  canceled_at: string | null
  cancel_reason: string | null
  demand_source: 'manual' | 'client_form' | 'ai_assistant'
  ai_generated_data: Record<string, unknown> | null
  ai_reviewed_by_client: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  organization?: Organization
  created_by?: Profile
  assigned_admin?: Profile
  audience_details?: DemandAudienceDetails
  attachments?: DemandAttachment[]
}

export interface DemandAudienceDetails {
  id: string
  demand_id: string
  hearing_area: HearingArea
  hearing_type: HearingType
  hearing_format: HearingFormat
  hearing_datetime: string | null
  process_number: string | null
  required_professional: RequiredProfessional | null
  city: string
  state: string
  service_location: string | null
  additional_instructions: string | null
  created_at: string
  updated_at: string
}

export interface DemandAttachment {
  id: string
  demand_id: string
  uploaded_by_user_id: string
  file_name: string
  file_url: string
  file_path: string
  file_type: string
  file_size: number
  category: AttachmentCategory
  visibility: 'client_and_admin' | 'admin_only'
  expires_at: string
  created_at: string
  uploaded_by?: Profile
}

export interface Invoice {
  id: string
  organization_id: string
  invoice_number: string
  billing_period_start: string
  billing_period_end: string
  total_amount: number
  status: InvoiceStatus
  payment_method: PaymentMethod | null
  due_date: string
  paid_at: string | null
  asaas_payment_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  organization?: Organization
  items?: InvoiceItem[]
  financial_documents?: FinancialDocument[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  demand_id: string | null
  description: string
  amount: number
  created_at: string
  demand?: Demand
}

export interface FinancialDocument {
  id: string
  invoice_id: string
  uploaded_by_user_id: string
  file_name: string
  file_url: string
  file_type: string
  category: 'nota_fiscal' | 'boleto' | 'comprovante' | 'resumo_demandas' | 'outro'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  organization_id: string | null
  demand_id: string | null
  invoice_id: string | null
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  organization_id: string | null
  entity_type: string
  entity_id: string
  action: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: Profile
}

export interface DemandComment {
  id: string
  demand_id: string
  user_id: string
  message: string
  visibility: 'internal' | 'client_visible'
  created_at: string
  user?: Profile
}

export interface DashboardStats {
  total: number
  nova_solicitacao: number
  programado: number
  em_andamento: number
  concluido: number
  arquivado: number
  cancelado: number
  urgentes: number
  faturasAbertas: number
  valorTotalMes: number
}
