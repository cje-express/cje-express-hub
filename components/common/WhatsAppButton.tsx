'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WHATSAPP_URL, WHATSAPP_MESSAGE } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  className?: string
  variant?: 'default' | 'compact' | 'floating'
  label?: string
}

export function WhatsAppButton({
  className,
  variant = 'default',
  label = 'Falar com Atendente',
}: WhatsAppButtonProps) {
  const url = `${WHATSAPP_URL}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  if (variant === 'floating') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-white shadow-lg hover:bg-green-600 transition-colors',
          className
        )}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium hidden sm:block">{label}</span>
      </a>
    )
  }

  if (variant === 'compact') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 text-green-600 border-green-200 hover:bg-green-50', className)}
        >
          <MessageCircle className="h-4 w-4" />
          {label}
        </Button>
      </a>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button
        className={cn(
          'gap-2 bg-green-500 hover:bg-green-600 text-white',
          className
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {label}
      </Button>
    </a>
  )
}
