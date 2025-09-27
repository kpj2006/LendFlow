// Network configuration and utilities for Rootstock Testnet

export const ROOTSTOCK_TESTNET = {
  chainId: '0x1f', // 31 in hex
  chainName: 'Rootstock Testnet',
  nativeCurrency: {
    name: 'Test RBTC',
    symbol: 'tRBTC',
    decimals: 18,
  },
  rpcUrls: ['https://public-node.testnet.rsk.co'],
  blockExplorerUrls: ['https://explorer.testnet.rootstock.io'],
}

/**
 * Add Rootstock Testnet to user's wallet (MetaMask, etc.)
 */
export async function addRootstockTestnet() {
  if (!window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [ROOTSTOCK_TESTNET],
    })
    return true
  } catch (error) {
    console.error('Failed to add Rootstock Testnet:', error)
    throw error
  }
}

/**
 * Switch to Rootstock Testnet
 */
export async function switchToRootstockTestnet() {
  if (!window.ethereum) {
    throw new Error('No wallet detected')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ROOTSTOCK_TESTNET.chainId }],
    })
    return true
  } catch (error) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      return await addRootstockTestnet()
    }
    throw error
  }
}