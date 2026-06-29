'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ChevronLeft, Save, Loader2, Trash2, ShieldCheck, ShieldOff,
  KeyRound, Mail, Phone, User, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserRoleBadge } from '@/components/common/UserRoleBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import { IS_DEMO_MODE } from '@/lib/demo'
import { USER_ROLE_LABELS } from '@/lib/constants'
import { getInitials, formatDate } from '@/lib/utils'
import type { UserRole } from '@/types'

const DEMO_PROFILES: Record<string, any> = {
  'demo-admin-001': {
    id: 'demo-admin-001', auth_user_id: 'demo-auth-admin-001',
    name: 'Administrador CJE', email: 'admin@cje.com.br',
    phone: '(11) 98213-1799', role: 'SUPER_ADMIN_CJE', status: 'active',
    created_at: '2024-01-01T00:00:00Z', last_login_at: '2026-06-15T10:00:00Z',
    organization: { id: 'demo-org-cje', name: 'CJE Express' },
  },
  'demo-client-001': {
    id: 'demo-client-001', auth_user_id: 'demo-auth-client-001',
    name: 'João Demo Silva', email: 'cliente@teste.com.br',
    phone: '(11) 99999-8888', role: 'ADMIN_CLIENTE', status: 'active',
    created_at: '2024-01-15T00:00:00Z', last_login_at: '2026-06-14T08:00:00Z',
    organization: { id: 'demo-org-cliente', name: 'Escritório Demo Advogados' },
  },
  'demo-op-001': {
    id: 'demo-op-001', auth_user_id: 'demo-auth-op-001',
    name: 'Maria Operadora', email: 'maria@demo-adv.com.br',
    phone: '(11) 98888-7777', role: 'OPERADOR_CLIENTE', status: 'active',
    created_at: '2024-02-10T00:00:00Z', last_login_at: null,
    organization: { id: 'demo-org-cliente', name: 'Escritório Demo Advogados' },
  },
  'demo-op-cje': {
    id: 'demo-op-cje', auth_user_id: 'demo-auth-op-cje',
    name: 'Carlos Operador CJE', email: 'carlos@cjeexpress.com.br',
    phone: '(11) 97777-6666', role: 'OPERADOR_CJE', status: 'active',
    created_at: '2024-03-01T00:00:00Z', last_login_at: '2026-06-13T14:00:00Z',
    organization: { id: 'demo-org-cje', name: 'CJE Express' },
  },
}

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: 'SUPER_ADMIN_CJE', label: 'Super Admin CJE' },
  { value: 'OPERADOR_CJE', label: 'Operador CJE' },
  { value: 'ADMIN_CLIENTE', label: 'Admin Cliente' },
  { value: 'OPERADOR_CLIENTE', label: 'Operador Cliente' },
]

export default function EditarUsuarioPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('ADMIN_CLIENTE')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [newPassword, setNewPassword] = useState('')

  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    async function load() {
      if (IS_DEMO_MODE) {
        const p = DEMO_PROFILES[id]
        if (!p) { toast.error('Usuário não encontrado'); router.back(); return }
        setProfile(p)
        setName(p.name)
        setEmail(p.email)
        setPhone(p.phone ?? '')
        setRole(p.role)
        setStatus(p.status)
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*, organization:organizations(id, name)')
        .eq('id', id)
        .single()

      if (!data) { toast.error('Usuário não encontrado'); router.back(); return }
      setProfile(data)
      setName(data.name)
      setEmail(data.email)
      setPhone(data.phone ?? '')
      setRole(data.role)
      setStatus(data.status)
      setIsLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    if (!name.trim() || !email.trim()) {
      toast.error('Nome e e-mail são obrigatórios.')
      return
    }

    setIsSaving(true)
    try {
      if (IS_DEMO_MODE) {
        toast.success('Dados atualizados com sucesso! (demo)')
        setIsSaving(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ name, email, phone: phone || null, role, status })
        .eq('id', id)

      if (error) { toast.error('Erro ao salvar.'); return }

      if (email !== profile.email && profile.auth_user_id) {
        await supabase.auth.admin.updateUserById(profile.auth_user_id, { email })
      }

      toast.success('Dados atualizados com sucesso!')
    } catch {
      toast.error('Erro inesperado.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (IS_DEMO_MODE) {
      toast.success('Senha alterada com sucesso! (demo)')
      setNewPassword('')
      return
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(profile.auth_user_id, {
        password: newPassword,
      })
      if (error) { toast.error(error.message); return }
      toast.success('Senha alterada com sucesso!')
      setNewPassword('')
    } catch {
      toast.error('Erro ao alterar senha.')
    }
  }

  async function handleToggleStatus() {
    const newStatus = status === 'active' ? 'inactive' : 'active'

    if (IS_DEMO_MODE) {
      setStatus(newStatus)
      setShowDeactivateDialog(false)
      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso! (demo)`)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      setStatus(newStatus)
      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'}.`)
    }
    setShowDeactivateDialog(false)
  }

  async function handleDelete() {
    if (IS_DEMO_MODE) {
      toast.success('Usuário removido com sucesso! (demo)')
      router.push('/admin/usuarios')
      return
    }

    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) {
      toast.success('Usuário removido.')
      router.push('/admin/usuarios')
    } else {
      toast.error('Erro ao remover.')
    }
    setShowDeleteDialog(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/usuarios">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
              {getInitials(profile?.name ?? '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile?.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <UserRoleBadge role={profile?.role} />
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">Desde {formatDate(profile?.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dados pessoais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome completo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> E-mail
              </Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Telefone
              </Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perfil e organização */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Perfil de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de acesso</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Organização
              </Label>
              <Input value={profile?.organization?.name ?? '—'} disabled className="bg-gray-50" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Último login: {profile?.last_login_at ? formatDate(profile.last_login_at) : 'Nunca'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Alterar senha */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleResetPassword}
              disabled={!newPassword}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              Redefinir
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            A nova senha será aplicada imediatamente. O usuário precisará usar a nova senha no próximo login.
          </p>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={status === 'active' ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-green-600 border-green-200 hover:bg-green-50'}
            onClick={() => setShowDeactivateDialog(true)}
          >
            {status === 'active' ? (
              <><ShieldOff className="mr-1.5 h-3.5 w-3.5" />Desativar</>
            ) : (
              <><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Reativar</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
          ) : (
            <><Save className="h-4 w-4" />Salvar alterações</>
          )}
        </Button>
      </div>

      <ConfirmDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        title={status === 'active' ? 'Desativar usuário?' : 'Reativar usuário?'}
        description={status === 'active'
          ? 'O usuário não conseguirá acessar a plataforma enquanto estiver desativado.'
          : 'O acesso do usuário será restaurado imediatamente.'
        }
        confirmLabel={status === 'active' ? 'Desativar' : 'Reativar'}
        onConfirm={handleToggleStatus}
        variant={status === 'active' ? 'destructive' : 'default'}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Excluir usuário permanentemente?"
        description="Esta ação não pode ser desfeita. Todos os dados do usuário serão removidos."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
