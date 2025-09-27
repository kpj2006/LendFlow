'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Banknote, Users, Target } from 'lucide-react'
import { GamingButton } from '@/components/ui/GamingButton'
import { StatsCard } from '@/components/ui/StatsCard'
import { formatNumber } from '@/lib/utils'
import toast from 'react-hot-toast'

const mockOrderbook = [
  { lender: 'Lender A', amount: 5000, apy: 3.8 },
  { lender: 'Lender B', amount: 3200, apy: 3.9 },
  { lender: 'Lender C', amount: 7500, apy: 4.0 },
  { lender: 'Lender D', amount: 2800, apy: 4.1 },
  { lender: 'Lender E', amount: 4100, apy: 4.2 }
]

export default function BorrowPage() {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [matches, setMatches] = useState<Array<{lender: string, amount: number, apy: number, used: number}>>([])
  const [borrowerType, setBorrowerType] = useState('')
  const [weightedAPY, setWeightedAPY] = useState(0)
  
  const totalLiquidity = mockOrderbook.reduce((sum, entry) => sum + entry.amount, 0)

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const requestAmount = parseFloat(amount)
      const percentage = (requestAmount / totalLiquidity) * 100
      
      const type = percentage <= 5 ? 'small' : percentage <= 15 ? 'medium' : 'whale'
      setBorrowerType(type)
      
      const sortedOrders = type === 'whale' 
        ? [...mockOrderbook].sort((a, b) => b.apy - a.apy)
        : [...mockOrderbook].sort((a, b) => a.apy - b.apy)
      
      const matchResult = []
      let remaining = requestAmount
      
      for (const order of sortedOrders) {
        if (remaining <= 0) break
        const used = Math.min(remaining, order.amount)
        matchResult.push({...order, used})
        remaining -= used
      }
      
      setMatches(matchResult)
      const totalUsed = matchResult.reduce((sum, m) => sum + m.used, 0)
      const weightedSum = matchResult.reduce((sum, m) => sum + (m.apy * m.used), 0)
      setWeightedAPY(totalUsed > 0 ? weightedSum / totalUsed : 0)
    } else {
      setMatches([])
      setBorrowerType('')
      setWeightedAPY(0)
    }
  }, [amount, totalLiquidity])

  const handleBorrow = async () => {
    if (!amount) {
      toast.error('Please enter amount')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      toast.success('Borrowed successfully!')
      setAmount('')
      setIsLoading(false)
    }, 2000)
  }

  const totalMatched = matches.reduce((sum, m) => sum + m.used, 0)

  return (
    <div className='min-h-screen bg-dark text-white'>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center gap-4 mb-8'>
          <Link href='/'>
            <GamingButton variant='secondary' size='sm'>
              <ArrowLeft className='mr-2 w-4 h-4' />
              Back
            </GamingButton>
          </Link>
          <h1 className='text-4xl font-gaming text-neon'>Smart Borrowing</h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          <div className='game-card'>
            <h2 className='text-xl font-gaming text-neon-pink mb-4'>Borrow Request</h2>
            <div className='space-y-4'>
              <input
                type='number'
                placeholder='Amount (USDC)'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className='w-full p-3 bg-gray-800 border border-gray-600 rounded font-gaming'
              />
              
              {borrowerType && (
                <div className='p-3 bg-gray-800/50 rounded border border-blue-500/30'>
                  <div className='flex items-center gap-2'>
                    <Users className='w-4 h-4' />
                    <span className='font-gaming capitalize'>{borrowerType} Borrower</span>
                  </div>
                  <p className='text-sm text-gray-400 mt-1'>
                    Matching: {borrowerType === 'whale' ? 'High' : 'Low'} APY first
                  </p>
                </div>
              )}

              {weightedAPY > 0 && (
                <div className='p-3 bg-gray-800/70 rounded'>
                  <div className='flex justify-between'>
                    <span>Your Rate:</span>
                    <span className='font-gaming text-neon'>{weightedAPY.toFixed(2)}%</span>
                  </div>
                </div>
              )}

              <GamingButton onClick={handleBorrow} disabled={isLoading} className='w-full'>
                {isLoading ? 'Processing...' : 'Borrow USDC'}
              </GamingButton>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='grid grid-cols-3 gap-4'>
              <StatsCard
                title='Available'
                value={'$' + formatNumber(totalLiquidity)}
                icon={<Banknote className='w-5 h-5' />}
              />
              <StatsCard
                title='Your APY'
                value={weightedAPY > 0 ? weightedAPY.toFixed(2) + '%' : '--'}
                icon={<TrendingUp className='w-5 h-5' />}
              />
              <StatsCard
                title='Matched'
                value={'$' + formatNumber(totalMatched)}
                icon={<Target className='w-5 h-5' />}
              />
            </div>

            <div className='game-card'>
              <h3 className='text-lg font-gaming text-neon-blue mb-4'>Orderbook Matching</h3>
              {matches.length > 0 ? (
                <div className='space-y-2'>
                  {matches.map((match, i) => (
                    <div key={i} className='flex justify-between p-2 bg-gray-800/50 rounded'>
                      <span>{match.lender}</span>
                      <span className='text-neon-blue'>{match.apy}%</span>
                      <span className='text-green-400'></span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-8'>Enter amount to see matching</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
