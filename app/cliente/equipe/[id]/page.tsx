'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChevronLeft, Save, Loader2, KeyRound, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { getInitials } from '@/lib/utils'
import type { UserRole } from '@/types'

const DEMO_MEMBERS: Record<string, any> = {
  'demo-op-cli-001': {
    id: 'demo-op-cli-001', name: 'Ana Paula Ferreira',
    email: 'ana@demo-adv.com.br', phone: '(11) 98765-4321',
    role: 'OPERADOR_CLIENTE', status: 'active', demandCount: 5,
  },
  'demo-op-cli-002': {
    id: 'demo-op-cli-002', name: 'Ricardo Mendes',
    email: 'ricardo@demo-adv.com.br', phone: '(11) 91234-5678',
    role: 'OPERADOR_CLIENTE', status: 'active', demandCount: 2,
  },
}

export default function EditarMembroPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<UserRole>('OPERADOR_CLIENTE')
  const [status, setStatus] = useState('active')
  const [newPassword, setNewPassword] = useState('')
  const [demandCount, setDemandCount] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const m = DEMO_MEMBERS[id]
    if (!m) { toast.error('Membro não encontrado'); router.back(); return }
    setName(m.name)
    setEmail(m.email)
    setPhone(m.phone ?? '')
    setRole(m.role)
    setStatus(m.status)
    setDemandCount(m.demandCount)
    setIsLoading(false)
  }, [id])

  async function handleSave() {
    if (!name.trim() || !email.trim()) {
      toast.error('Nome e e-mail são obrigatórios.')
      return
    }
    setIsSaving(true)
    setTimeout(() => {
      toast.success('Dados atualizados com sucesso! (demo)')
      setIsSaving(false)
    }, 500)
  }

  function handleResetPassword() {
    if (!newPassword || newPassword.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    toast.success('Senha alterada com sucesso! (demo)')
    setNewPassword('')
  }

  function handleToggleStatus() {
    const next = status === 'active' ? 'inactive' : 'active'
    setStatus(next)
    toast.success(`Membro ${next === 'active' ? 'ativado' : 'desativado'}. As demandas foram mantidas. (demo)`)
  }

  function handleDelete() {
    toast.success('Membro removido da equipe. As demandas foram mantidas no sistema. (demo)')
    setShowDeleteDialog(false)
    router.push('/cliente/equipe')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cliente/equipe">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            <p className="text-xs text-gray-500">{demandCount} demanda(s) solicitada(s)</p>
          </div>
        </div>
      </div>

      {/* Dados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados do membro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Permissão</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPERADOR_CLIENTE">Operador</SelectItem>
                <SelectItem value="ADMIN_CLIENTE">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alterar senha */}
      <Card className="border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-blue-600" />
            Redefinir senha do membro
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
            <Button variant="outline" onClick={handleResetPassword} disabled={!newPassword} className="gap-2">
              <KeyRound className="h-4 w-4" />
              Redefinir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            className={status === 'active' ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-green-600 border-green-200 hover:bg-green-50'}
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
            Remover
          </Button>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
          ) : (
            <><Save className="h-4 w-4" />Salvar</>
          )}
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Remover membro permanentemente?"
        description="O membro será removido da equipe. Todas as demandas solicitadas por ele permanecerão cadastradas no sistema."
        confirmLabel="Remover"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
