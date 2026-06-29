'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, FileText, FileSpreadsheet, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function CriarDemandaPage() {
  const router = useRouter()

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Criar Demanda</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecione a melhor opção para registrar suas demandas.
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Opção 1: Formulário */}
        <Link href="/cliente/demandas/nova" className="block">
          <Card className="h-full border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="rounded-xl bg-blue-50 p-3">
                  <FileText className="h-7 w-7 text-blue-600" />
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  COMPLETO
                </span>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Estruturado · Passo a passo
              </p>
              <h2 className="text-lg font-bold text-gray-900 mt-1">
                Solicitar Nova Diligência
              </h2>
              <p className="text-sm text-gray-500 mt-3 flex-1">
                Solicite sua diligência preenchendo as informações através do nosso formulário estruturado.
              </p>

              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 rounded-full border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-700 group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">
                  SELECIONAR
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Opção 2: Planilha */}
        <Link href="/cliente/demandas/importar" className="block">
          <Card className="h-full border-2 border-gray-200 hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  LOTE
                </span>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Lote · Processamento em massa
              </p>
              <h2 className="text-lg font-bold text-gray-900 mt-1">
                Importar Demandas por Planilha
              </h2>
              <p className="text-sm text-gray-500 mt-3 flex-1">
                Faça o upload de centenas de diligências de uma só vez, através de planilhas Excel ou CSV e elimine o trabalho manual.
              </p>

              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 rounded-full border-2 border-emerald-200 py-2.5 text-sm font-semibold text-emerald-700 group-hover:border-emerald-400 group-hover:bg-emerald-50 transition-colors">
                  SELECIONAR
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
