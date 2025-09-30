'use client'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets, RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit'
import { injectedWallet, metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import ErrorBoundary from '../components/ErrorBoundary'
import { useEffect } from 'react'
import { watchAccount, watchNetwork } from 'wagmi/actions'
// Focusing only on Rootstock testnet for this dapp
import '@rainbow-me/rainbowkit/styles.css'

// Configure development and production networks
// const localhost = {
//   id: 1337,
//   name: 'Localhost 8545',
//   network: 'localhost',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Ether',
//     symbol: 'ETH',
//   },
//   rpcUrls: {
//     public: { http: ['http://127.0.0.1:8545'] },
//     default: { http: ['http://127.0.0.1:8545'] },
//   },
//   blockExplorers: {
//     default: { name: 'Local Explorer', url: 'http://localhost:8545' },
//   },
// }

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
    public: { http: ['https://rootstock-testnet.g.alchemy.com/v2/dY2Oq6aoW2AGPCaTZxyjl'] },
    default: { http: ['https://rootstock-testnet.g.alchemy.com/v2/dY2Oq6aoW2AGPCaTZxyjl'] },
  },
  blockExplorers: {
    default: { name: 'RSK Testnet Explorer', url: 'https://explorer.testnet.rootstock.io/' },
  },
}

// // Add Ethereum Mainnet for broader compatibility
// const ethereum = {
//   id: 1,
//   name: 'Ethereum',
//   network: 'homestead',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Ether',
//     symbol: 'ETH',
//   },
//   rpcUrls: {
//     public: { http: ['https://cloudflare-eth.com'] },
//     default: { http: ['https://cloudflare-eth.com'] },
//   },
//   blockExplorers: {
//     default: { name: 'Etherscan', url: 'https://etherscan.io' },
//   },
// }

// Use localhost for development, Rootstock testnet for production
const isDevelopment = process.env.NEXT_PUBLIC_NETWORK === 'Rootstock Testnet'
// Allow multiple networks - users can connect from any supported network
const activeChains = isDevelopment 
  ? [rootstockTestnet] 
  : [rootstockTestnet]

const { chains, publicClient } = configureChains(
  activeChains,
  [publicProvider({
    // Add multiple RPC endpoints for better reliability
    rpc: (chain) => {
      if (chain.id === 31) {
        return {
          http: [
            'https://rootstock-testnet.g.alchemy.com/v2/dY2Oq6aoW2AGPCaTZxyjl',
            'https://mycrypto.testnet.rsk.co'
          ]
        }
      } else if (chain.id === 1337) {
        return {
          http: ['http://127.0.0.1:8545']
        }
      } else if (chain.id === 1) {
        return {
          http: ['https://cloudflare-eth.com']
        }
      }
      // Allow other chains to use their default configuration
      return null
    }
  })]
)

// Configure wallets - use simpler setup in development to avoid WalletConnect issues
const connectors = isDevelopment 
  ? connectorsForWallets([
      {
        groupName: 'Popular',
        wallets: [
          injectedWallet({ chains }),
          metaMaskWallet({ chains, projectId: 'dev-mode' })
        ]
      }
    ])
  : getDefaultWallets({
      appName: 'Lending Protocol',
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,   //|| 'demo-project-id-for-development'
      chains
    }).connectors

const config = createConfig({
  autoConnect: true, // Enable auto-connect for better UX, but ensure it updates on MetaMask changes
  connectors,
  publicClient
})

export function Providers({ children }) {
  useEffect(() => {
    // Watch for account changes and force re-render if needed
    const unwatchAccount = watchAccount((account) => {
      console.log('Account changed:', account)
      // This will trigger re-renders in components using useAccount
    })

    // Watch for network changes
    const unwatchNetwork = watchNetwork((network) => {
      console.log('Network changed:', network)
      // This will trigger re-renders in components using useNetwork
    })

    return () => {
      unwatchAccount()
      unwatchNetwork()
    }
  }, [])

  return (
    <ErrorBoundary>
      <WagmiConfig config={config}>
        <RainbowKitProvider 
          chains={chains}
          coolMode={!isDevelopment} // Disable cool mode in development
          showRecentTransactions={false}
          initialChain={undefined} // Don't force any specific initial chain
        >
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </ErrorBoundary>
  )
}
