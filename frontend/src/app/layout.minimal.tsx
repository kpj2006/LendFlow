import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DeFi Gaming Protocol - Lend & Borrow with Style',
  description: 'A gaming-themed DeFi lending protocol with fixed-APY orderbook and hybrid APY tracking',
  keywords: 'DeFi, lending, borrowing, gaming, blockchain, cryptocurrency',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-slate-900 text-white`}>
        <div className="min-h-screen">
          {children}
        </div>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #ff0080',
              boxShadow: '0 0 20px rgba(255, 0, 128, 0.3)',
            },
          }}
        />
      </body>
    </html>
  )
}