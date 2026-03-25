import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'TOM ERP — Gestion Vinted',
  description: 'ERP professionnel pour la revente Vinted',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-gray-950 text-gray-100">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
