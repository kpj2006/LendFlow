'use client'

import React from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from 'wagmi/connectors'

// Ultra-lightweight config to prevent chunking issues
const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
  },
  ssr: false,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 300000, // 5 minutes
    },
  },
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}