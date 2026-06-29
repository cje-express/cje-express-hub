'use client'

import { useState, useRef } from 'react'
import { Paperclip, MessageSquarePlus, Send, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ClientDemandActionsProps {
  demandId: string
  currentNotes: string | null
}

export function ClientDemandActions({ demandId, currentNotes }: ClientDemandActionsProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSaveNotes() {
    if (!notes.trim()) return
    setIsSaving(true)
    setTimeout(() => {
      toast.success('Observação adicionada com sucesso! (demo)')
      setIsSaving(false)
      setShowNotes(false)
    }, 800)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    setIsUploading(true)
    const newFiles = Array.from(files).map((f) => ({ name: f.name, size: f.size }))

    setTimeout(() => {
      setUploadedFiles((prev) => [...prev, ...newFiles])
      setIsUploading(false)
      toast.success(`${newFiles.length} documento(s) anexado(s) com sucesso! (demo)`)
      if (fileRef.current) fileRef.current.value = ''
    }, 1000)
  }

  function removeFile(idx: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
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

          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border bg-green-50 border-green-200 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700 truncate">{f.name}</p>
                    <p className="text-[10px] text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 ml-2">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="border-t" />

        {/* Observações */}
        {!showNotes ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full justify-center"
            onClick={() => setShowNotes(true)}
          >
            <MessageSquarePlus className="h-4 w-4" />
            Adicionar observação
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
                  <><Send className="h-3.5 w-3.5" />Enviar</>
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNotes(false)}>
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
