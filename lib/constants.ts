import type {
  DemandStatus,
  DemandType,
  UserRole,
  OrganizationType,
  InvoiceStatus,
  HearingArea,
  HearingType,
  HearingFormat,
  RequiredProfessional,
  DemandUrgency,
  BillingType,
  PaymentMethod,
} from '@/types'

export const WHATSAPP_NUMBER = '5511982131799'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
export const WHATSAPP_MESSAGE =
  'Olá, equipe CJE Express. Preciso de atendimento sobre uma demanda.'

export const DEMAND_STATUS_LABELS: Record<DemandStatus, string> = {
  nova_solicitacao: 'Nova Solicitação',
  programado: 'Programado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
  cancelado: 'Cancelado',
}

export const DEMAND_STATUS_COLORS: Record<DemandStatus, string> = {
  nova_solicitacao: 'bg-blue-100 text-blue-800 border-blue-200',
  programado: 'bg-purple-100 text-purple-800 border-purple-200',
  em_andamento: 'bg-amber-100 text-amber-800 border-amber-200',
  concluido: 'bg-green-100 text-green-800 border-green-200',
  arquivado: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
}

export const DEMAND_TYPE_LABELS: Record<DemandType, string> = {
  audiencia: 'Audiência',
  acompanhamentos: 'Acompanhamentos',
  diligencia_forum: 'Diligência no Fórum',
  despachos: 'Despachos',
  protocolos: 'Protocolos',
  copias: 'Cópias',
  outros: 'Outros',
}

export const DEMAND_TYPES: Array<{ value: DemandType; label: string; icon: string }> = [
  { value: 'audiencia', label: 'Audiência', icon: '⚖️' },
  { value: 'acompanhamentos', label: 'Acompanhamentos', icon: '📋' },
  { value: 'diligencia_forum', label: 'Diligência no Fórum', icon: '🏛️' },
  { value: 'despachos', label: 'Despachos', icon: '📄' },
  { value: 'protocolos', label: 'Protocolos', icon: '📬' },
  { value: 'copias', label: 'Cópias', icon: '🗂️' },
  { value: 'outros', label: 'Outros', icon: '📌' },
]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN_CJE: 'Super Admin CJE',
  OPERADOR_CJE: 'Operador CJE',
  ADMIN_CLIENTE: 'Admin Cliente',
  OPERADOR_CLIENTE: 'Operador Cliente',
}

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  escritorio_advocacia: 'Escritório de Advocacia',
  empresa_juridico: 'Empresa com Depto. Jurídico',
  advogado_autonomo: 'Advogado Autônomo',
  imobiliaria: 'Imobiliária',
  pessoa_fisica: 'Pessoa Física',
  outro: 'Outro',
  interno: 'Interno (CJE)',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Rascunho',
  open: 'Em Aberto',
  paid: 'Pago',
  overdue: 'Vencido',
  canceled: 'Cancelado',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  canceled: 'bg-gray-100 text-gray-500 border-gray-200',
}

export const HEARING_AREA_LABELS: Record<HearingArea, string> = {
  trabalhista: 'Trabalhista',
  civel: 'Cível',
  criminal: 'Criminal',
  tributaria: 'Tributária',
}

export const HEARING_TYPE_LABELS: Record<HearingType, string> = {
  conciliacao: 'Conciliação',
  inicial: 'Inicial',
  instrucao: 'Instrução',
  una: 'Una',
  julgamento: 'Julgamento',
}

export const HEARING_FORMAT_LABELS: Record<HearingFormat, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
}

export const REQUIRED_PROFESSIONAL_LABELS: Record<RequiredProfessional, string> = {
  somente_advogado: 'Somente Advogado',
  somente_preposto: 'Somente Preposto',
  advogado_e_preposto: 'Advogado + Preposto',
  advogado: 'Advogado',
  correspondente: 'Correspondente',
}

export const URGENCY_LABELS: Record<DemandUrgency, string> = {
  normal: 'Normal',
  urgente: 'Urgente',
}

export const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  mensal: 'Cobrança Mensal',
  avulsa: 'Cobrança Avulsa',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  nf_pagamento_externo: 'NF + Pagamento Externo',
  externo: 'Externo',
}

export const BRAZIL_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

export const DEADLINE_WARNING_DAYS = 2

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
]

export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png',
]

export const MAX_FILE_SIZE_MB = 20
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const DOCUMENT_RETENTION_DAYS = 90
