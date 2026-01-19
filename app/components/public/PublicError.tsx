export function PublicError() {
  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-black mb-4">Error</div>
        <p className="text-gray-600">Something went wrong. Please try again later.</p>
      </div>
    </main>
  )
}
