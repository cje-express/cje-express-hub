'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageCropperProps {
  imageUrl: string
  onCrop: (croppedBlob: Blob) => void
  onCancel: () => void
}

export function ImageCropper({ imageUrl, onCrop, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const [loaded, setLoaded] = useState(false)

  const CROP_SIZE = 280
  const OUTPUT_SIZE = 512

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      setLoaded(true)
    }
    img.src = imageUrl
  }, [imageUrl])

  // Base scale: fit the image so it covers the crop circle (cover behavior)
  const baseScale = loaded
    ? CROP_SIZE / Math.min(naturalSize.w, naturalSize.h)
    : 1

  // Draw preview on canvas every frame
  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CROP_SIZE
    canvas.height = CROP_SIZE

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE)

    // Clip to circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Draw image centered with zoom and offset
    const scale = baseScale * zoom
    const drawW = naturalSize.w * scale
    const drawH = naturalSize.h * scale
    const drawX = (CROP_SIZE - drawW) / 2 + offset.x
    const drawY = (CROP_SIZE - drawH) / 2 + offset.y

    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH)
    ctx.restore()

    // Draw circle border
    ctx.beginPath()
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2 - 1, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [loaded, zoom, offset, naturalSize, baseScale])

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handlePointerUp = () => {
    setDragging(false)
  }

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    setZoom((prev) => Math.max(1, Math.min(5, prev - e.deltaY * 0.002)))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  function handleZoomBtn(delta: number) {
    setZoom((prev) => Math.max(1, Math.min(5, prev + delta)))
  }

  function handleReset() {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  function handleCrop() {
    if (!imgRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Circular clip
    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Same math as preview but scaled to output
    const ratio = OUTPUT_SIZE / CROP_SIZE
    const scale = baseScale * zoom
    const drawW = naturalSize.w * scale * ratio
    const drawH = naturalSize.h * scale * ratio
    const drawX = ((CROP_SIZE - naturalSize.w * scale) / 2 + offset.x) * ratio
    const drawY = ((CROP_SIZE - naturalSize.h * scale) / 2 + offset.y) * ratio

    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH)

    canvas.toBlob((blob) => {
      if (blob) onCrop(blob)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Ajustar foto</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop area */}
        <div className="bg-gray-900 flex items-center justify-center p-6">
          <canvas
            ref={canvasRef}
            width={CROP_SIZE}
            height={CROP_SIZE}
            className="rounded-full cursor-grab active:cursor-grabbing"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-4">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <button onClick={() => handleZoomBtn(-0.25)} className="text-gray-500 hover:text-gray-700">
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min="1"
              max="5"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <button onClick={() => handleZoomBtn(0.25)} className="text-gray-500 hover:text-gray-700">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 ml-1" title="Resetar">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Arraste para reposicionar · Scroll ou slider para zoom
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCrop} className="flex-1 gap-2">
              <Check className="h-4 w-4" />
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
