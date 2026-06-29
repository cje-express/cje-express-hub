export default function ClienteLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded mt-2" />
        </div>
        <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-card" />
        ))}
      </div>
      <div className="h-64 rounded-lg border bg-card" />
    </div>
  )
}
