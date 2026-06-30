'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Building2, Eye, Pencil, PowerOff, Power, X,
  CheckCircle2, type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/common/EmptyState'
import { ORGANIZATION_TYPE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Organization } from '@/types'

const TABS: { key: 'ativos' | 'desativados'; label: string; icon: LucideIcon }[] = [
  { key: 'ativos',      label: 'Ativos',      icon: CheckCircle2 },
  { key: 'desativados', label: 'Desativados', icon: PowerOff },
]

interface Props {
  organizations: Organization[]
}

export function ClientesList({ organizations: initial }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'ativos' | 'desativados'>('ativos')
  const [items, setItems]   = useState(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Organization | null>(null)

  const ativos      = items.filter((o) => o.status === 'active')
  const desativados = items.filter((o) => o.status !== 'active')
  const list        = tab === 'ativos' ? ativos : desativados

  async function toggleStatus(org: Organization) {
    const newStatus = org.status === 'active' ? 'inactive' : 'active'
    setLoadingId(org.id)
    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) { toast.error('Erro ao atualizar status.'); return }
      setItems((prev) => prev.map((o) => o.id === org.id ? { ...o, status: newStatus } : o))
      toast.success(newStatus === 'active' ? 'Cliente reativado.' : 'Cliente desativado.')
      setTab(newStatus === 'active' ? 'ativos' : 'desativados')
    } catch { toast.error('Erro ao atualizar.') }
    finally { setLoadingId(null) }
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => {
          const count = t.key === 'ativos' ? ativos.length : desativados.length
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-gradient-to-r from-[#006497] to-[#094882] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                active ? 'bg-white/20 text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      {list.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={tab === 'ativos' ? 'Nenhum cliente ativo' : 'Nenhum cliente desativado'}
          description={tab === 'ativos' ? 'Cadastre o primeiro cliente.' : 'Clientes desativados aparecerão aqui.'}
        />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">CNPJ/CPF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Cidade/UF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{org.name}</p>
                    {org.corporate_name && org.corporate_name !== org.name && (
                      <p className="text-xs text-gray-400">{org.corporate_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">
                    {ORGANIZATION_TYPE_LABELS[org.type]}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs font-mono text-gray-500">
                    {org.cnpj_cpf ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                    {org.city ? `${org.city}/${org.state}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                      org.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    )}>
                      {org.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/clientes/${org.id}`}>
                        <Button size="sm" variant="outline" className="gap-1 h-8 px-2.5">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Ver</span>
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => setEditing(org)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingId === org.id}
                        className={cn(
                          'gap-1 h-8 px-2.5',
                          org.status === 'active'
                            ? 'text-red-500 border-red-200 hover:bg-red-50'
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                        )}
                        onClick={() => toggleStatus(org)}
                      >
                        {org.status === 'active'
                          ? <><PowerOff className="h-3.5 w-3.5" /><span className="hidden sm:inline">Desativar</span></>
                          : <><Power className="h-3.5 w-3.5" /><span className="hidden sm:inline">Reativar</span></>
                        }
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <EditModal
          org={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o))
            setEditing(null)
            toast.success('Dados atualizados.')
          }}
        />
      )}
    </>
  )
}

/* ── Edit Modal ── */
function EditModal({
  org, onClose, onSaved,
}: {
  org: Organization
  onClose: () => void
  onSaved: (updated: Partial<Organization>) => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:           org.name ?? '',
    corporate_name: org.corporate_name ?? '',
    cnpj_cpf:       org.cnpj_cpf ?? '',
    email:          org.email ?? '',
    phone:          org.phone ?? '',
    whatsapp:       org.whatsapp ?? '',
    city:           org.city ?? '',
    state:          org.state ?? '',
    address:        org.address ?? '',
    zip_code:       org.zip_code ?? '',
  })

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nome é obrigatório.'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast.error('Erro ao salvar.'); return }
      onSaved(form)
    } catch { toast.error('Erro ao salvar.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006497] to-[#094882] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Editar Cliente</h2>
            <p className="text-white/60 text-xs mt-0.5">{org.name}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Nome / Fantasia *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Razão Social</Label>
              <Input value={form.corporate_name} onChange={(e) => set('corporate_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ / CPF</Label>
              <Input value={form.cnpj_cpf} onChange={(e) => set('cnpj_cpf', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado (UF)</Label>
              <Input maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input value={form.zip_code} onChange={(e) => set('zip_code', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2 flex-shrink-0 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-[#006497] to-[#094882] text-white hover:opacity-90"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </div>
  )
}
