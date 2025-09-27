'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Gamepad2, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Zap,
  ArrowRight,
  Coins,
  Banknote
} from 'lucide-react'
import { GamingScene } from '@/components/three/GamingScene'
import { StatsCard } from '@/components/ui/StatsCard'
import { GamingButton } from '@/components/ui/GamingButton'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Subtle Three.js Background Scene */}
      <div className="fixed inset-0 z-0 w-full h-full opacity-30">
        <GamingScene />
      </div>

      {/* Navigation Header */}
      <nav className="relative z-50 flex items-center justify-between p-6 bg-black/10 backdrop-blur-md border-b border-dark-border">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="h-8 w-8 text-neon-pink" />
          <span className="text-2xl font-gaming text-neon">DeFi Gaming Protocol</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <GamingButton variant="secondary" size="sm">
              Dashboard
            </GamingButton>
          </Link>
          <GamingButton variant="primary" size="sm">
            Connect Wallet
          </GamingButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-gaming font-black text-neon mb-6 animate-glow">
            GAME THE
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-blue">
              DEFI MARKET
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
            Lend and borrow with style in our gaming-themed DeFi protocol.
            <br />
            Fixed-APY orderbook meets hybrid APY tracking.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/lend">
              <GamingButton variant="primary" size="lg" className="w-full sm:w-auto">
                <Coins className="mr-2 h-5 w-5" />
                START LENDING
                <ArrowRight className="ml-2 h-5 w-5" />
              </GamingButton>
            </Link>
            
            <Link href="/borrow">
              <GamingButton variant="secondary" size="lg" className="w-full sm:w-auto">
                <Banknote className="mr-2 h-5 w-5" />
                BORROW NOW
                <ArrowRight className="ml-2 h-5 w-5" />
              </GamingButton>
            </Link>
            
            <Link href="/dashboard">
              <GamingButton variant="success" size="lg" className="w-full sm:w-auto">
                <TrendingUp className="mr-2 h-5 w-5" />
                VIEW ANALYTICS
                <ArrowRight className="ml-2 h-5 w-5" />
              </GamingButton>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <StatsCard
              icon={<DollarSign className="h-8 w-8" />}
              title="Total Liquidity"
              value="$12.5M"
              change="+23.4%"
              color="neon-green"
            />
            <StatsCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Avg APY"
              value="8.45%"
              change="+0.12%"
              color="neon-blue"
            />
            <StatsCard
              icon={<Shield className="h-8 w-8" />}
              title="Active Users"
              value="1,337"
              change="+156"
              color="neon-pink"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-30 py-20 px-6 bg-black/10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-gaming text-center text-neon mb-16">
            LEVEL UP YOUR DEFI GAME
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Cards */}
            <FeatureCard
              icon={<Zap className="h-12 w-12" />}
              title="Lightning Fast"
              description="Execute trades at the speed of light with our optimized smart contracts"
              gradient="from-neon-yellow to-neon-green"
            />
            <FeatureCard
              icon={<Shield className="h-12 w-12" />}
              title="Battle-Tested Security"
              description="Audited smart contracts with military-grade security protocols"
              gradient="from-neon-blue to-neon-purple"
            />
            <FeatureCard
              icon={<TrendingUp className="h-12 w-12" />}
              title="Smart APY Tracking"
              description="Hybrid APY system combining Maker + Aave for optimal returns"
              gradient="from-neon-pink to-neon-cyan"
            />
            <FeatureCard
              icon={<Gamepad2 className="h-12 w-12" />}
              title="Gaming Experience"
              description="Immersive UI that makes DeFi feel like your favorite game"
              gradient="from-neon-green to-neon-yellow"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-30 py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-gaming text-neon mb-8">
            READY TO PLAY?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Join the next generation of DeFi gaming and start earning today
          </p>
          <Link href="/dashboard">
            <GamingButton variant="primary" size="xl">
              <Gamepad2 className="mr-2 h-6 w-6" />
              ENTER THE PROTOCOL
            </GamingButton>
          </Link>
        </div>
      </section>
    </main>
  )
}

// Feature Card Component
function FeatureCard({ 
  icon, 
  title, 
  description, 
  gradient 
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className="game-card group hover:scale-105 transition-all duration-300">
      <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${gradient} mb-6 group-hover:animate-float`}>
        <div className="text-black">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-gaming text-white mb-4">
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  )
}