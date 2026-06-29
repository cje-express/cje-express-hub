'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ChevronLeft, Upload, FileSpreadsheet, Download, Loader2,
  CheckCircle, AlertTriangle, X, FileText, MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WHATSAPP_URL, WHATSAPP_MESSAGE } from '@/lib/constants'

interface ParsedRow {
  tipo: string
  cidade: string
  estado: string
  urgencia: string
  prazo: string
  processo: string
  instrucoes: string
  valid: boolean
  error?: string
}

export default function ImportarDemandasPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [imported, setImported] = useState(false)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Formato inválido. Use .xlsx, .xls ou .csv')
      return
    }

    setFile(f)
    setIsProcessing(true)

    // Simulate parsing
    setTimeout(() => {
      const mockRows: ParsedRow[] = [
        { tipo: 'audiencia', cidade: 'São Paulo', estado: 'SP', urgencia: 'normal', prazo: '2026-07-15', processo: '0001234-56.2024.5.02.0001', instrucoes: 'Comparecer 30min antes', valid: true },
        { tipo: 'protocolos', cidade: 'Santo André', estado: 'SP', urgencia: 'urgente', prazo: '2026-07-10', processo: '', instrucoes: 'Protocolar em 3 vias', valid: true },
        { tipo: 'diligencia_forum', cidade: 'Guarulhos', estado: 'SP', urgencia: 'normal', prazo: '2026-07-20', processo: '0009876-54.2023.8.26.0224', instrucoes: '', valid: true },
        { tipo: 'copias', cidade: '', estado: 'SP', urgencia: 'normal', prazo: '', processo: '', instrucoes: 'Obter cópias do processo completo', valid: false, error: 'Cidade é obrigatória' },
        { tipo: 'despachos', cidade: 'Osasco', estado: 'SP', urgencia: 'normal', prazo: '2026-07-25', processo: '0005555-11.2024.8.26.0405', instrucoes: '', valid: true },
      ]
      setRows(mockRows)
      setIsProcessing(false)
      toast.success(`${mockRows.length} linha(s) encontrada(s) na planilha`)
    }, 1500)
  }

  function handleImport() {
    const validRows = rows.filter((r) => r.valid)
    if (validRows.length === 0) {
      toast.error('Nenhuma linha válida para importar.')
      return
    }

    setIsImporting(true)
    setTimeout(() => {
      setIsImporting(false)
      setImported(true)
      toast.success(`${validRows.length} demanda(s) importada(s) com sucesso! (demo)`)
    }, 2000)
  }

  function handleDownloadTemplate() {
    const csvContent = 'tipo,cidade,estado,urgencia,prazo,numero_processo,instrucoes\naudiencia,São Paulo,SP,normal,2026-07-15,0001234-56.2024.5.02.0001,Comparecer 30 min antes\nprotocolos,Santo André,SP,urgente,2026-07-10,,Protocolar em 3 vias'
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelo_importacao_cje.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Modelo baixado!')
  }

  const validCount = rows.filter((r) => r.valid).length
  const errorCount = rows.filter((r) => !r.valid).length

  const TIPO_LABELS: Record<string, string> = {
    audiencia: 'Audiência', protocolos: 'Protocolos', diligencia_forum: 'Diligência',
    copias: 'Cópias', despachos: 'Despachos', acompanhamentos: 'Acompanhamentos', outros: 'Outros',
  }

  if (imported) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-50">
          <CheckCircle className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Recebemos sua solicitação</h1>
        <p className="text-gray-500">
          {validCount} demanda(s) foram importadas com sucesso. Nossa equipe entrará em contato em minutos pelo WhatsApp para prosseguir.
        </p>
        <div className="space-y-3 pt-2">
          <a
            href={`${WHATSAPP_URL}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="outline" className="w-full gap-2 h-12 text-green-700 border-green-300 hover:bg-green-50">
              <MessageCircle className="h-5 w-5" />
              Falar com atendente pelo WhatsApp
            </Button>
          </a>
          <Link href="/cliente/dashboard" className="block">
            <Button variant="ghost" className="w-full h-12 text-gray-500">
              Voltar para o painel principal
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cliente/demandas/criar">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importar Demandas</h1>
          <p className="text-sm text-gray-500">Upload de planilha Excel ou CSV</p>
        </div>
      </div>

      {/* Modelo */}
      <Card className="border-dashed border-2">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Modelo de planilha</p>
              <p className="text-xs text-gray-500">Baixe o modelo CSV com as colunas corretas</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar modelo
          </Button>
        </CardContent>
      </Card>

      {/* Upload */}
      {!file ? (
        <Card>
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full p-12 flex flex-col items-center gap-4 hover:bg-gray-50 transition-colors rounded-lg"
            >
              <div className="rounded-full bg-blue-50 p-4">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">
                  Clique para selecionar a planilha
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Formatos aceitos: .xlsx, .xls, .csv — Máximo 1000 linhas
                </p>
              </div>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* File info */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setRows([]) }}>
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {isProcessing ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm text-gray-500">Processando planilha...</p>
            </div>
          ) : rows.length > 0 && (
            <>
              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 rounded-lg border bg-green-50 border-green-200 px-4 py-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{validCount} válida(s)</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border bg-red-50 border-red-200 px-4 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">{errorCount} com erro(s)</span>
                  </div>
                )}
              </div>

              {/* Preview table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Prévia dos dados</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">#</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Tipo</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Cidade/UF</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Urgência</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Prazo</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map((row, i) => (
                          <tr key={i} className={!row.valid ? 'bg-red-50/50' : 'hover:bg-gray-50'}>
                            <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                            <td className="px-4 py-2.5 text-xs font-medium">{TIPO_LABELS[row.tipo] ?? row.tipo}</td>
                            <td className="px-4 py-2.5 text-xs">{row.cidade ? `${row.cidade}/${row.estado}` : <span className="text-red-500">—</span>}</td>
                            <td className="px-4 py-2.5 text-xs">
                              {row.urgencia === 'urgente' ? (
                                <span className="text-red-600 font-medium">Urgente</span>
                              ) : 'Normal'}
                            </td>
                            <td className="px-4 py-2.5 text-xs">{row.prazo || '—'}</td>
                            <td className="px-4 py-2.5">
                              {row.valid ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle className="h-3.5 w-3.5" /> OK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-red-600" title={row.error}>
                                  <AlertTriangle className="h-3.5 w-3.5" /> {row.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setFile(null); setRows([]) }}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting || validCount === 0}
                  className="gap-2"
                >
                  {isImporting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Importando...</>
                  ) : (
                    <><Upload className="h-4 w-4" />Importar {validCount} demanda(s)</>
                  )}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Colunas aceitas */}
      <Card className="bg-gray-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Colunas aceitas na planilha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            {[
              { col: 'tipo *', desc: 'audiencia, protocolos, diligencia_forum, despachos, copias, acompanhamentos, outros' },
              { col: 'cidade *', desc: 'Nome da cidade' },
              { col: 'estado *', desc: 'UF (SP, RJ, MG...)' },
              { col: 'urgencia', desc: 'normal ou urgente' },
              { col: 'prazo', desc: 'Data (AAAA-MM-DD)' },
              { col: 'numero_processo', desc: 'Número do processo' },
              { col: 'instrucoes', desc: 'Observações adicionais' },
              { col: 'local', desc: 'Local do serviço' },
            ].map((item) => (
              <div key={item.col} className="rounded border bg-white p-2">
                <p className="font-mono font-semibold text-gray-800">{item.col}</p>
                <p className="text-gray-400 mt-0.5 leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
