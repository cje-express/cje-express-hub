'use client'

import { Download, FileText, File, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, formatFileSize } from '@/lib/utils'
import type { DemandAttachment } from '@/types'

interface AttachmentListProps {
  attachments: DemandAttachment[]
  showCategory?: boolean
}

function getFileIcon(fileType: string) {
  if (fileType.includes('image')) return <ImageIcon className="h-4 w-4" />
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
  return <File className="h-4 w-4 text-gray-500" />
}

const CATEGORY_LABELS: Record<string, string> = {
  client_document: 'Documento do cliente',
  admin_document: 'Documento admin',
  final_report: 'Relatório final',
  certificate: 'Certidão',
  proof: 'Comprovante',
  invoice: 'Fatura',
  boleto: 'Boleto',
  other: 'Outro',
}

export function AttachmentList({ attachments, showCategory = false }: AttachmentListProps) {
  if (attachments.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Nenhum anexo disponível.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
        >
          <div className="rounded bg-white p-2 border">
            {getFileIcon(attachment.file_type)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{attachment.file_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">{formatFileSize(attachment.file_size)}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{formatDate(attachment.created_at)}</span>
              {showCategory && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-500">
                    {CATEGORY_LABELS[attachment.category] ?? attachment.category}
                  </span>
                </>
              )}
            </div>
          </div>
          <a
            href={attachment.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.file_name}
          >
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Download className="h-4 w-4" />
            </Button>
          </a>
        </div>
      ))}
    </div>
  )
}
