'use client'

export interface CredentialsPdfData {
  name: string
  email: string
  password: string
  organization: string
  role?: string
  siteUrl?: string
}

async function toBase64(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

export async function downloadCredentialsPdf(data: CredentialsPdfData) {
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const url = data.siteUrl ?? 'https://cjeexpress.com.br'

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(0, 100, 151)
  doc.rect(0, 0, W, 48, 'F')

  doc.setFillColor(9, 72, 130)
  doc.rect(0, 36, W, 12, 'F')

  // Logo (white PNG)
  try {
    const logoBase64 = await toBase64('/icons/logo-cje-white.png')
    // Logo centered, height ~28mm, auto width
    const logoH = 28
    const logoW = logoH * 2.0   // approximate aspect ratio of the CJE logo
    const logoX = (W - logoW) / 2
    doc.addImage(logoBase64, 'PNG', logoX, 3, logoW, logoH)
  } catch {
    // Fallback: text only
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('CJE Express Hub', W / 2, 22, { align: 'center' })
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('DADOS DE ACESSO — CONFIDENCIAL', W / 2, 43, { align: 'center' })

  // ── Body ────────────────────────────────────────────────────────────────────
  let y = 64

  function section(title: string) {
    doc.setFillColor(240, 245, 255)
    doc.roundedRect(14, y - 5, W - 28, 8, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(0, 100, 151)
    doc.text(title.toUpperCase(), 18, y)
    y += 9
  }

  function field(label: string, value: string, highlight = false) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(label, 18, y)
    y += 5

    if (highlight) {
      doc.setFillColor(0, 100, 151)
      doc.roundedRect(14, y - 4, W - 28, 9, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('courier', 'bold')
      doc.setFontSize(12)
      doc.text(value, 18, y + 2)
      doc.setFont('helvetica', 'normal')
      y += 13
    } else {
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(value, 18, y + 1)
      y += 10
    }
  }

  function divider() {
    doc.setDrawColor(220, 225, 235)
    doc.line(14, y, W - 14, y)
    y += 8
  }

  // Identificação
  section('Identificação')
  y += 2
  field('Nome completo', data.name)
  field('Organização', data.organization)
  if (data.role) field('Perfil de acesso', data.role)
  divider()

  // Credenciais
  section('Credenciais de acesso')
  y += 2
  field('E-mail (login)', data.email)
  field('Senha inicial', data.password, true)
  divider()

  // Acesso
  section('Como acessar o sistema')
  y += 2
  field('Endereço de acesso', url)

  // Steps
  const steps = [
    '1. Acesse o endereço acima no navegador',
    '2. Informe o e-mail e a senha indicados neste documento',
    '3. Após o primeiro login, altere sua senha em Configurações',
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  steps.forEach((s) => {
    doc.text(s, 18, y)
    y += 6
  })

  y += 4
  divider()

  // ── Warning box ─────────────────────────────────────────────────────────────
  doc.setFillColor(255, 247, 237)
  doc.setDrawColor(255, 160, 50)
  doc.roundedRect(14, y, W - 28, 22, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(180, 90, 0)
  doc.text('⚠  AVISO DE SEGURANÇA', 18, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 60, 0)
  doc.text('Este documento contém informações confidenciais. Não compartilhe com terceiros.', 18, y + 13)
  doc.text('Após o primeiro acesso, altere a senha imediatamente.', 18, y + 18)

  // ── Footer ──────────────────────────────────────────────────────────────────
  doc.setFillColor(0, 100, 151)
  doc.rect(0, 277, W, 20, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(`Gerado em ${now} pelo CJE Express Hub`, 14, 285)
  doc.text(url, W - 14, 285, { align: 'right' })

  const fileName = `acesso-${data.name.toLowerCase().replace(/\s+/g, '-')}.pdf`
  doc.save(fileName)
}
