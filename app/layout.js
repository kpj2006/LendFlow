import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })

export const metadata = {
  title: 'LendFlow',
  description: 'Gamified decentralized lending protocol with orderbook matching - Enter the DeFi Matrix',
  keywords: 'DeFi, Lending, Gaming, Cryptocurrency, Blockchain, CyberPunk',
  authors: [{ name: 'CyberLend Team' }],
  themeColor: '#06b6d4',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} ${orbitron.variable} bg-gray-900 text-gray-100 min-h-screen`}>
        <div className="relative min-h-screen">
          {/* Animated background pattern */}
          <div className="fixed inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.2) 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
                               radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)`,
            }} />
          </div>
          
          {/* Grid pattern overlay */}
          <div 
            className="fixed inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
          
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
}
