export function Watermark() {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <a
        href="https://biolinq.page"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5
          bg-neo-dark text-white text-xs font-mono
          border-[2px] border-neo-dark rounded-full
          shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]
          hover:bg-gray-800 transition-colors"
      >
        <span>Powered by</span>
        <span className="font-bold text-neo-primary">BioLinq</span>
      </a>
    </div>
  )
}
