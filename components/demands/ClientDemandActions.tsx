'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, MessageSquarePlus, Send, Loader2, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

interface ClientDemandActionsProps {
  demandId: string
  currentNotes: string | null
}

export function ClientDemandActions({ demandId, currentNotes }: ClientDemandActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('profiles')
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .single()
    return data
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files
    if (!selected || selected.length === 0) return

    if (IS_DEMO) {
      toast.success(`${selected.length} documento(s) anexado(s)! (demo)`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setIsUploading(true)
    try {
      const profile = await getProfile()
      if (!profile) { toast.error('Sessão expirada'); return }

      let successCount = 0
      for (const file of Array.from(selected)) {
        const filePath = `organizations/${profile.organization_id}/demands/${demandId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('demand-documents')
          .upload(filePath, file)

        if (uploadError) {
          toast.error(`Erro ao enviar "${file.name}": ${uploadError.message}`)
          continue
        }

        const { data: { publicUrl } } = supabase.storage.from('demand-documents').getPublicUrl(filePath)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 90)

        const { error: insertError } = await supabase.from('demand_attachments').insert({
          demand_id: demandId,
          uploaded_by_user_id: profile.id,
          file_name: file.name,
          file_url: publicUrl,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          category: 'client_document',
          visibility: 'client_and_admin',
          expires_at: expiresAt.toISOString(),
        })

        if (insertError) {
          toast.error(`Erro ao registrar "${file.name}".`)
        } else {
          successCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} documento(s) anexado(s) com sucesso!`)
        router.refresh()
      }
    } catch {
      toast.error('Erro inesperado ao enviar.')
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSaveNotes() {
    if (!notes.trim()) return

    if (IS_DEMO) {
      toast.success('Observação adicionada! (demo)')
      setShowNotes(false)
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('demands')
        .update({ client_notes: notes.trim() })
        .eq('id', demandId)

      if (error) {
        toast.error('Erro ao salvar observação.')
        return
      }

      toast.success('Observação salva com sucesso!')
      setShowNotes(false)
      router.refresh()
    } catch {
      toast.error('Erro inesperado.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ações</CardTitle>
        <p className="text-xs text-gray-400">Anexe documentos ou adicione observações</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload de documentos */}
        <div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full justify-center"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
            ) : (
              <><Paperclip className="h-4 w-4" />Anexar documento</>
            )}
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="border-t" />

        {/* Observações */}
        {currentNotes && !showNotes && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-gray-700">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">Observação registrada</span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-3">{currentNotes}</p>
            <button
              className="text-xs text-blue-600 underline mt-1"
              onClick={() => setShowNotes(true)}
            >
              Editar
            </button>
          </div>
        )}

        {!showNotes ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full justify-center"
            onClick={() => setShowNotes(true)}
          >
            <MessageSquarePlus className="h-4 w-4" />
            {currentNotes ? 'Editar observação' : 'Adicionar observação'}
          </Button>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite suas observações ou instruções adicionais..."
              rows={4}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={isSaving || !notes.trim()}
                className="gap-1.5 flex-1"
              >
                {isSaving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Salvando...</>
                ) : (
                  <><Send className="h-3.5 w-3.5" />Salvar</>
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowNotes(false); setNotes(currentNotes ?? '') }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Após o envio, apenas a equipe CJE Express pode alterar dados da solicitação.
          Você pode anexar novos documentos e adicionar observações a qualquer momento.
        </p>
      </CardContent>
    </Card>
  )
}
