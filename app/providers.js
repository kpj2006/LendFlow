'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
// Focusing only on Rootstock testnet for this dapp
import '@rainbow-me/rainbowkit/styles.css'

// Configure Rootstock Testnet network (primary network for this dapp)
const rootstockTestnet = {
  id: 31,
  name: 'Rootstock Testnet',
  network: 'rootstock-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Test RBTC',
    symbol: 'tRBTC',
  },
  rpcUrls: {
    public: { http: ['https://public-node.testnet.rsk.co'] },
    default: { http: ['https://public-node.testnet.rsk.co'] },
  },
  blockExplorers: {
    default: { name: 'RSK Testnet Explorer', url: 'https://explorer.testnet.rsk.co' },
  },
}

const { chains, publicClient } = configureChains(
  [rootstockTestnet], // Only Rootstock testnet for this dapp
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'Lending Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id-for-development',
  chains
})

const config = createConfig({
  autoConnect: false, // Disable auto-connect to prevent socket stalling
  connectors,
  publicClient
})

export function Providers({ children }) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider 
        chains={chains}
        coolMode
        showRecentTransactions={false}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
