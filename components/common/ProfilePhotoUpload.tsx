'use client'

import { useState, useRef } from 'react'
import { Camera, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ImageCropper } from './ImageCropper'
import { getInitials } from '@/lib/utils'

interface ProfilePhotoUploadProps {
  name: string
  avatarUrl: string | null
  onUpload: (file: File) => Promise<string | null>
  onRemove: () => void
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
}

const TEXT_SIZES = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
}

export function ProfilePhotoUpload({
  name,
  avatarUrl,
  onUpload,
  onRemove,
  size = 'lg',
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(avatarUrl)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem (JPG, PNG, etc.)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB.')
      return
    }

    const url = URL.createObjectURL(file)
    setCropImageUrl(url)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleCrop(blob: Blob) {
    setCropImageUrl(null)
    setIsUploading(true)
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      const url = await onUpload(file)
      if (url) {
        setPreview(url)
        toast.success('Foto atualizada com sucesso!')
      }
    } catch {
      toast.error('Erro ao enviar foto.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleCancelCrop() {
    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl)
    setCropImageUrl(null)
  }

  function handleRemove() {
    onRemove()
    setPreview(null)
    toast.success('Foto removida.')
  }

  return (
    <>
      <div className="flex items-center gap-5">
        <div className="relative group">
          <Avatar className={`${SIZES[size]} ring-2 ring-gray-200`}>
            <AvatarImage src={preview ?? undefined} className="object-cover" />
            <AvatarFallback className={`bg-blue-100 text-blue-700 font-bold ${TEXT_SIZES[size]}`}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 transition-colors cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : (
              <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-900">Foto de perfil</p>
            <p className="text-xs text-gray-400">JPG, PNG ou WebP. Máx. 10MB.</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="gap-1.5"
            >
              <Camera className="h-3.5 w-3.5" />
              {preview ? 'Trocar' : 'Enviar foto'}
            </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      {cropImageUrl && (
        <ImageCropper
          imageUrl={cropImageUrl}
          onCrop={handleCrop}
          onCancel={handleCancelCrop}
        />
      )}
    </>
  )
}
