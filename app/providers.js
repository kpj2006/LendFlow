'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

// Configure Rootstock network
const rootstock = {
  id: 30,
  name: 'Rootstock',
  network: 'rootstock',
  nativeCurrency: {
    decimals: 18,
    name: 'Rootstock Bitcoin',
    symbol: 'RBTC',
  },
  rpcUrls: {
    public: { http: ['https://public-node.rsk.co'] },
    default: { http: ['https://public-node.rsk.co'] },
  },
  blockExplorers: {
    default: { name: 'RSK Explorer', url: 'https://explorer.rsk.co' },
  },
}

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
  [rootstock, rootstockTestnet, mainnet, polygon, arbitrum, optimism],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'Lending Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id-for-development',
  chains
})

const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

export function Providers({ children }) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
