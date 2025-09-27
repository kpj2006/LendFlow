'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
// Focusing only on Rootstock testnet for this dapp
import '@rainbow-me/rainbowkit/styles.css'

// Configure development and production networks
const localhost = {
  id: 1337,
  name: 'Localhost 8545',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: 'http://localhost:8545' },
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

// Use localhost for development, Rootstock testnet for production
const isDevelopment = process.env.NEXT_PUBLIC_NETWORK === 'localhost'
const activeChains = isDevelopment ? [localhost] : [rootstockTestnet]

const { chains, publicClient } = configureChains(
  activeChains,
  [publicProvider({
    // Add multiple RPC endpoints for better reliability
    rpc: (chain) => {
      if (chain.id === 31) {
        return {
          http: [
            'https://public-node.testnet.rsk.co',
            'https://mycrypto.testnet.rsk.co'
          ]
        }
      } else if (chain.id === 1337) {
        return {
          http: ['http://127.0.0.1:8545']
        }
      }
      return null
    }
  })]
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
