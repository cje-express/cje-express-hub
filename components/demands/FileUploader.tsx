'use client'

import { useState, useCallback } from 'react'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils'
import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SelectedFile {
  file: File
  preview?: string
  error?: string
}

interface FileUploaderProps {
  files: SelectedFile[]
  onChange: (files: SelectedFile[]) => void
  maxFiles?: number
  className?: string
}

export function FileUploader({
  files,
  onChange,
  maxFiles = 10,
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  function validateFile(file: File): string | null {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Tipo de arquivo não permitido. Use: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB`
    }
    return null
  }

  function addFiles(newFiles: File[]) {
    const remaining = maxFiles - files.length
    const toAdd = newFiles.slice(0, remaining).map((file) => ({
      file,
      error: validateFile(file) ?? undefined,
    }))
    onChange([...files, ...toAdd])
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const dropped = Array.from(e.dataTransfer.files)
      addFiles(dropped)
    },
    [files]
  )

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    addFiles(selected)
    e.target.value = ''
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 font-medium">
          Arraste arquivos ou{' '}
          <label className="text-blue-600 cursor-pointer hover:underline">
            clique aqui
            <input
              type="file"
              multiple
              accept={ALLOWED_FILE_EXTENSIONS.join(',')}
              onChange={onInputChange}
              className="sr-only"
            />
          </label>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          PDF, DOC, DOCX, XLS, XLSX, JPG, PNG — máx. {MAX_FILE_SIZE_MB}MB por arquivo
        </p>
        {files.length >= maxFiles && (
          <p className="text-xs text-amber-600 mt-1">
            Limite de {maxFiles} arquivos atingido
          </p>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3',
                f.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
              )}
            >
              <div className={cn('rounded p-1.5', f.error ? 'bg-red-100' : 'bg-white')}>
                {f.error ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{f.file.name}</p>
                {f.error ? (
                  <p className="text-xs text-red-500">{f.error}</p>
                ) : (
                  <p className="text-xs text-gray-500">{formatFileSize(f.file.size)}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={() => removeFile(i)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
