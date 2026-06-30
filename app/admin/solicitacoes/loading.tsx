export default function SolicitacoesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="flex gap-2">
        <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-lg border bg-card" />
      ))}
    </div>
  )
}
