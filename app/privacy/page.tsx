export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-gray-500 mb-8">CJE Express Hub — Em construção</p>
        <div className="rounded-lg border bg-white p-8 text-gray-600 space-y-4">
          <p>
            A CJE Express valoriza a privacidade dos seus dados. Esta política descreve como
            coletamos, usamos e protegemos suas informações.
          </p>
          <p>
            Os documentos enviados à plataforma são retidos por <strong>90 dias</strong> e
            em seguida removidos automaticamente, conforme política de retenção de dados.
          </p>
          <p>
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
          </p>
          <p>
            Para mais informações:{' '}
            <a href="mailto:contato@cjeexpress.com.br" className="text-blue-600 hover:underline">
              contato@cjeexpress.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
