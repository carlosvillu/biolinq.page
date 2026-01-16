export function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'w-6 h-6'} fill="none">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  )
}
