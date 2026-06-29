'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, FileText, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { getInitials } from '@/lib/utils'
import type { UserRole } from '@/types'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  status: string
  avatar_url: string | null
  demandCount: number
}

interface TeamMemberCardsProps {
  members: TeamMember[]
  currentUserId: string
  isAdmin: boolean
}

const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
  ADMIN_CLIENTE: { label: 'ADMINISTRADOR', color: 'text-blue-600' },
  OPERADOR_CLIENTE: { label: 'OPERADOR', color: 'text-green-600' },
}

export function TeamMemberCards({ members, currentUserId, isAdmin }: TeamMemberCardsProps) {
  const [teamList, setTeamList] = useState(members)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null)

  function handleToggleStatus(id: string) {
    setTeamList((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m
      )
    )
    const member = teamList.find((m) => m.id === id)
    const newStatus = member?.status === 'active' ? 'desativado' : 'ativado'
    toast.success(`${member?.name} foi ${newStatus} com sucesso! (demo)`)
    setDeactivateTarget(null)
  }

  function handleDelete(id: string) {
    const member = teamList.find((m) => m.id === id)
    setTeamList((prev) => prev.filter((m) => m.id !== id))
    toast.success(`${member?.name} foi removido da equipe. As demandas foram mantidas. (demo)`)
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {teamList.map((member) => {
          const isYou = member.id === currentUserId
          const isActive = member.status === 'active'
          const roleInfo = ROLE_DISPLAY[member.role] ?? { label: member.role, color: 'text-gray-600' }

          return (
            <Card
              key={member.id}
              className={`overflow-hidden transition-shadow hover:shadow-md ${!isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-0">
                {/* Header with avatar and role */}
                <div className="flex items-start gap-4 p-5 pb-4">
                  <Avatar className="h-14 w-14 ring-2 ring-gray-100">
                    <AvatarImage src={member.avatar_url ?? undefined} className="object-cover" />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {member.name}
                      {isYou && <span className="text-xs text-gray-400 font-normal ml-1.5">(você)</span>}
                    </p>
                    <p className={`text-xs font-bold uppercase tracking-wide mt-0.5 ${roleInfo.color}`}>
                      {roleInfo.label}
                    </p>
                  </div>
                </div>

                {/* Contact info */}
                <div className="px-5 space-y-2.5 pb-4">
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>{member.phone ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-700">
                    <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>Demandas Solicitadas: <strong>{member.demandCount}</strong></span>
                  </div>
                </div>

                {/* Footer with status and actions */}
                <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50/50">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {isActive ? (
                        <Eye className="h-3 w-3 text-green-600" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isAdmin && !isYou && (
                    <div className="flex items-center gap-1">
                      <Link href={`/cliente/equipe/${member.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${isActive ? 'text-gray-400 hover:text-amber-600' : 'text-gray-400 hover:text-green-600'}`}
                        onClick={() => setDeactivateTarget(member.id)}
                      >
                        {isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                        onClick={() => setDeleteTarget(member.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={() => setDeactivateTarget(null)}
        title={
          teamList.find((m) => m.id === deactivateTarget)?.status === 'active'
            ? 'Desativar membro?'
            : 'Reativar membro?'
        }
        description={
          teamList.find((m) => m.id === deactivateTarget)?.status === 'active'
            ? 'O membro não conseguirá acessar a plataforma. As demandas existentes serão mantidas.'
            : 'O acesso será restaurado imediatamente.'
        }
        confirmLabel={
          teamList.find((m) => m.id === deactivateTarget)?.status === 'active' ? 'Desativar' : 'Reativar'
        }
        onConfirm={() => deactivateTarget && handleToggleStatus(deactivateTarget)}
        variant={
          teamList.find((m) => m.id === deactivateTarget)?.status === 'active' ? 'destructive' : 'default'
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Remover membro da equipe?"
        description="O membro será removido permanentemente. Todas as demandas solicitadas por ele serão mantidas no sistema."
        confirmLabel="Remover"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        variant="destructive"
      />
    </>
  )
}
