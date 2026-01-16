import { Toaster as SonnerToaster } from 'sonner'
import type { ComponentProps } from 'react'

type ToasterProps = ComponentProps<typeof SonnerToaster>

export function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-paper group-[.toaster]:text-ink group-[.toaster]:border group-[.toaster]:border-silver group-[.toaster]:shadow-none',
          description: 'group-[.toast]:text-slate',
          actionButton: 'group-[.toast]:bg-ink group-[.toast]:text-paper',
          cancelButton: 'group-[.toast]:bg-pearl group-[.toast]:text-ink',
        },
      }}
      {...props}
    />
  )
}
