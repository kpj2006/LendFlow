import { useReadContract, useWriteContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'

// Mock contract ABI - replace with actual contract ABI
const PROTOCOL_ABI = [
  {
    name: 'getStableAPY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'lend',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'apy', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'borrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getOrderbook',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'lender', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'apy', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
] as const

// Mock contract address - replace with actual deployed contract
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' as const

export function useStableAPY() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PROTOCOL_ABI,
    functionName: 'getStableAPY',
  })

  return {
    apy: data ? Number(formatEther(data as bigint)) : 0,
    isLoading,
    error,
  }
}

export function useOrderbook() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PROTOCOL_ABI,
    functionName: 'getOrderbook',
  })

  return {
    orderbook: data ? (data as any[]).map((order, index) => ({
      id: `order-${index}`,
      lender: order.lender,
      amount: Number(formatEther(order.amount)),
      apy: Number(formatEther(order.apy)),
      timestamp: Number(order.timestamp) * 1000,
    })) : [],
    isLoading,
    error,
  }
}

export function useLend() {
  const { writeContract, isPending, error } = useWriteContract()

  const lend = (amount: string, apy: number) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PROTOCOL_ABI,
      functionName: 'lend',
      args: [parseEther(amount), parseEther(apy.toString())],
    })
  }

  return {
    lend,
    isLoading: isPending,
    error,
  }
}

export function useBorrow() {
  const { writeContract, isPending, error } = useWriteContract()

  const borrow = (amount: string) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: PROTOCOL_ABI,
      functionName: 'borrow',
      args: [parseEther(amount)],
    })
  }

  return {
    borrow,
    isLoading: isPending,
    error,
  }
}

// Custom hook for protocol data
export function useProtocolData() {
  const { apy: stableAPY, isLoading: apyLoading } = useStableAPY()
  const { orderbook, isLoading: orderbookLoading } = useOrderbook()

  const totalLiquidity = orderbook.reduce((sum, order) => sum + order.amount, 0)
  const averageAPY = orderbook.length > 0 
    ? orderbook.reduce((sum, order) => sum + order.apy, 0) / orderbook.length 
    : 0

  return {
    stableAPY,
    orderbook,
    totalLiquidity,
    averageAPY,
    isLoading: apyLoading || orderbookLoading,
  }
}