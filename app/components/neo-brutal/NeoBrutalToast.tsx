import type { ReactNode } from 'react'
import { Toast } from '@base-ui/react/toast'
import { cn } from '~/lib/utils'

// Provider that wraps the app
export interface NeoBrutalToastProviderProps {
  children: ReactNode
}

export function NeoBrutalToastProvider({ children }: NeoBrutalToastProviderProps) {
  return (
    <Toast.Provider>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-sm">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

// Internal component that renders all toasts
function ToastList() {
  const { toasts } = Toast.useToastManager()

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      swipeDirection="right"
      className={cn(
        'relative',
        'data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:slide-out-to-right',
        'data-[starting-style]:animate-in data-[starting-style]:fade-in-0 data-[starting-style]:slide-in-from-right'
      )}
    >
      {/* Shadow Layer */}
      <div className="absolute inset-0 bg-neo-dark rounded translate-x-1 translate-y-1" />

      {/* Toast Content */}
      <Toast.Content
        className={cn(
          'relative z-10 border-[3px] border-neo-dark rounded p-4 min-w-[300px]',
          toast.type === 'success' && 'bg-neo-primary',
          toast.type === 'error' && 'bg-neo-accent text-white',
          (!toast.type || toast.type === 'default') && 'bg-white'
        )}
      >
        <div className="flex flex-col gap-1">
          {toast.title && (
            <Toast.Title className="font-bold text-sm">{toast.title}</Toast.Title>
          )}
          {toast.description && (
            <Toast.Description className="text-sm">{toast.description}</Toast.Description>
          )}
        </div>

        {/* Close button */}
        <Toast.Close
          className="absolute top-2 right-2 p-1 rounded hover:bg-neo-dark/10 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ))
}

// Hook para usar toast desde componentes
export function useNeoBrutalToast() {
  return Toast.useToastManager()
}
