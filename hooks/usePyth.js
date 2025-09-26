import { useState, useEffect } from 'react'
import { useContractRead } from 'wagmi'
import { CONTRACT_ADDRESSES, LENDING_POOL_ABI } from './useContract'

// Pyth Network integration hook
export function usePythPriceFeed() {
  const [priceData, setPriceData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get Pyth APY from contract
  const { data: pythAPY, isLoading: apyLoading, error: apyError } = useContractRead({
    address: CONTRACT_ADDRESSES.LENDING_POOL,
    abi: LENDING_POOL_ABI,
    functionName: 'getPythAPY',
    watch: true
  })

  useEffect(() => {
    if (pythAPY !== undefined) {
      setPriceData({
        apy: pythAPY,
        timestamp: Date.now()
      })
      setIsLoading(false)
    }
    
    if (apyError) {
      setError(apyError)
      setIsLoading(false)
    }
  }, [pythAPY, apyError])

  return {
    priceData,
    isLoading: apyLoading || isLoading,
    error
  }
}

// Hook for APY range calculation based on Pyth reference
export function useAPYRange() {
  const { priceData, isLoading } = usePythPriceFeed()
  const [apyRange, setApyRange] = useState({ min: 360, max: 400, reference: 380 })

  useEffect(() => {
    if (priceData && priceData.apy) {
      const referenceAPY = Number(priceData.apy)
      const range = 20 // ±20 basis points
      
      setApyRange({
        min: Math.max(100, referenceAPY - range), // Minimum 1%
        max: Math.min(5000, referenceAPY + range), // Maximum 50%
        reference: referenceAPY
      })
    }
  }, [priceData])

  return {
    apyRange,
    isLoading,
    isValidAPY: (apy) => {
      if (!apyRange) return false
      return apy >= apyRange.min && apy <= apyRange.max
    }
  }
}

// Hook for market conditions based on Pyth data
export function useMarketConditions() {
  const { priceData, isLoading } = usePythPriceFeed()
  const [conditions, setConditions] = useState({
    volatility: 'low',
    trend: 'stable',
    recommendation: 'neutral'
  })

  useEffect(() => {
    if (priceData) {
      // Simple market condition logic based on APY
      const apy = Number(priceData.apy)
      
      let volatility = 'low'
      let trend = 'stable'
      let recommendation = 'neutral'

      if (apy < 350) {
        trend = 'declining'
        recommendation = 'good-time-to-borrow'
      } else if (apy > 450) {
        trend = 'rising'
        recommendation = 'good-time-to-lend'
      }

      // Simulate volatility based on APY changes
      if (apy > 400 || apy < 320) {
        volatility = 'high'
      } else if (apy > 380 || apy < 340) {
        volatility = 'medium'
      }

      setConditions({ volatility, trend, recommendation })
    }
  }, [priceData])

  return {
    conditions,
    isLoading
  }
}

// Utility functions for Pyth integration
export const pythUtils = {
  // Convert Pyth price to APY (simplified)
  priceToAPY: (price, confidence) => {
    // This is a simplified conversion
    // In a real implementation, you'd use more sophisticated logic
    const baseAPY = 360 // 3.6% base
    const volatility = confidence ? Number(confidence) / 1000 : 0
    return baseAPY + volatility
  },

  // Get APY recommendation based on current market
  getAPYRecommendation: (currentAPY, marketAPY) => {
    const diff = Math.abs(currentAPY - marketAPY)
    
    if (diff < 10) return 'optimal'
    if (currentAPY < marketAPY) return 'increase'
    return 'decrease'
  },

  // Format APY for display
  formatAPY: (apy) => {
    return `${(Number(apy) / 100).toFixed(2)}%`
  }
}
