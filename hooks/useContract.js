import { useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { parseUnits, formatUnits } from 'ethers'

// Contract addresses (replace with actual deployed addresses)
export const CONTRACT_ADDRESSES = {
  // Core Protocol
  LENDING_POOL: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '0x...',
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x...',
  CETH: process.env.NEXT_PUBLIC_CETH_ADDRESS || '0x...',
  PYTH_ORACLE: process.env.NEXT_PUBLIC_PYTH_ORACLE_ADDRESS || '0x...',

  // Walrus Protocol
  WALRUS_STORAGE: process.env.NEXT_PUBLIC_WALRUS_STORAGE_ADDRESS || '0x...',
  WALRUS_TOKEN: process.env.NEXT_PUBLIC_WALRUS_TOKEN_ADDRESS || '0x...',

  // Rootstock Bridge
  ROOTSTOCK_BRIDGE: process.env.NEXT_PUBLIC_ROOTSTOCK_BRIDGE_ADDRESS || '0x...',

  // MakerDAO
  MAKER_POT: process.env.NEXT_PUBLIC_MAKER_POT_ADDRESS || '0x...',
  MAKER_DAI: process.env.NEXT_PUBLIC_MAKER_DAI_ADDRESS || '0x...',

  // Aave v3
  AAVE_V3_POOL: process.env.NEXT_PUBLIC_AAVE_V3_POOL_ADDRESS || '0x...',
  AAVE_V3_DATA_PROVIDER: process.env.NEXT_PUBLIC_AAVE_V3_DATA_PROVIDER_ADDRESS || '0x...'
}

// Complete LendingPoolIntegrated ABI
export const LENDING_POOL_ABI = [
  // ===== CORE LENDING FUNCTIONS =====
  {
    "inputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "fixedAPY", "type": "uint256"},
      {"internalType": "bool", "name": "useBitcoinCollateral", "type": "bool"},
      {"internalType": "bytes", "name": "lenderMetadata", "type": "bytes"}
    ],
    "name": "addLiquidity",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bytes", "name": "loanDocument", "type": "bytes"},
      {"internalType": "bool", "name": "requireBTCCollateral", "type": "bool"},
      {"internalType": "string", "name": "targetChain", "type": "string"}
    ],
    "name": "requestLoan",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "repayLoan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdrawLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimInterest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimWalrusRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ===== STABLE APY FUNCTIONS =====
  {
    "inputs": [],
    "name": "updateStableAPY",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStableAPY",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMinAPY",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMaxAPY",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== VIEW FUNCTIONS =====
  {
    "inputs": [],
    "name": "getPoolStatus",
    "outputs": [
      {"internalType": "uint256", "name": "totalAvailable", "type": "uint256"},
      {"internalType": "uint256", "name": "totalLent", "type": "uint256"},
      {"internalType": "uint256", "name": "activeLenders", "type": "uint256"},
      {"internalType": "uint256", "name": "activeBorrowers", "type": "uint256"},
      {"internalType": "uint256", "name": "averageAPY", "type": "uint256"},
      {"internalType": "uint256", "name": "totalInterest", "type": "uint256"},
      {"internalType": "uint256", "name": "totalBTCLocked", "type": "uint256"},
      {"internalType": "uint256", "name": "totalWalrusRewards", "type": "uint256"},
      {"internalType": "uint256", "name": "crossChainLoans", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "lender", "type": "address"}],
    "name": "getLenderDetails",
    "outputs": [
      {"internalType": "uint256", "name": "totalDeposited", "type": "uint256"},
      {"internalType": "uint256", "name": "availableAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "lentAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "earnedInterest", "type": "uint256"},
      {"internalType": "uint256", "name": "fixedAPY", "type": "uint256"},
      {"internalType": "bool", "name": "active", "type": "bool"},
      {"internalType": "uint256", "name": "walrusRewards", "type": "uint256"},
      {"internalType": "uint256", "name": "btcCollateral", "type": "uint256"},
      {"internalType": "bool", "name": "isBitcoinLender", "type": "bool"},
      {"internalType": "bytes32", "name": "lenderDataBlob", "type": "bytes32"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "borrower", "type": "address"}],
    "name": "getBorrowerDetails",
    "outputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "weightedAPY", "type": "uint256"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "dueDate", "type": "uint256"},
      {"internalType": "bool", "name": "active", "type": "bool"},
      {"internalType": "bytes32", "name": "loanDocumentBlob", "type": "bytes32"},
      {"internalType": "uint256", "name": "btcCollateralRatio", "type": "uint256"},
      {"internalType": "bool", "name": "crossChainLoan", "type": "bool"},
      {"internalType": "uint256", "name": "currentRepaymentAmount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== WALRUS DATA RETRIEVAL =====
  {
    "inputs": [{"internalType": "address", "name": "lender", "type": "address"}],
    "name": "retrieveLenderData",
    "outputs": [{"internalType": "bytes", "name": "", "type": "bytes"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "borrower", "type": "address"}],
    "name": "retrieveLoanDocument",
    "outputs": [{"internalType": "bytes", "name": "", "type": "bytes"}],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== SIMULATION FUNCTIONS =====
  {
    "inputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bool", "name": "requireBTCCollateral", "type": "bool"}
    ],
    "name": "simulateLoan",
    "outputs": [
      {"internalType": "tuple[]", "name": "chunks", "type": "tuple[]", "components": [
        {"internalType": "address", "name": "lender", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"},
        {"internalType": "uint256", "name": "apy", "type": "uint256"},
        {"internalType": "bytes32", "name": "chunkDataBlob", "type": "bytes32"}
      ]},
      {"internalType": "uint256", "name": "weightedAPY", "type": "uint256"},
      {"internalType": "uint256", "name": "requiredBTCCollateral", "type": "uint256"},
      {"internalType": "uint256", "name": "estimatedWalrusStorageCost", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== PROTOCOL METRICS =====
  {
    "inputs": [],
    "name": "getProtocolMetrics",
    "outputs": [
      {"internalType": "uint256", "name": "totalWalrusDataStored", "type": "uint256"},
      {"internalType": "uint256", "name": "totalBTCCollateralLocked", "type": "uint256"},
      {"internalType": "uint256", "name": "availableWalrusRewards", "type": "uint256"},
      {"internalType": "tuple", "name": "currentFees", "type": "tuple", "components": [
        {"internalType": "uint256", "name": "walrusStorageFee", "type": "uint256"},
        {"internalType": "uint256", "name": "rootstockBridgeFee", "type": "uint256"},
        {"internalType": "uint256", "name": "pythUpdateFee", "type": "uint256"}
      ]},
      {"internalType": "uint256", "name": "contractUSDCBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "contractETHBalance", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ===== LEGACY FUNCTIONS (for backward compatibility) =====
  {
    "inputs": [{"internalType": "address", "name": "lender", "type": "address"}],
    "name": "lenders",
    "outputs": [
      {"internalType": "uint256", "name": "totalDeposited", "type": "uint256"},
      {"internalType": "uint256", "name": "availableAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "lentAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "earnedInterest", "type": "uint256"},
      {"internalType": "uint256", "name": "fixedAPY", "type": "uint256"},
      {"internalType": "bool", "name": "active", "type": "bool"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "bytes32", "name": "lenderDataBlob", "type": "bytes32"},
      {"internalType": "uint256", "name": "walrusRewards", "type": "uint256"},
      {"internalType": "uint256", "name": "btcCollateral", "type": "uint256"},
      {"internalType": "bool", "name": "isBitcoinLender", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "borrower", "type": "address"}],
    "name": "borrowers",
    "outputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "weightedAPY", "type": "uint256"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "dueDate", "type": "uint256"},
      {"internalType": "bool", "name": "active", "type": "bool"},
      {"internalType": "bytes32", "name": "loanDocumentBlob", "type": "bytes32"},
      {"internalType": "uint256", "name": "btcCollateralRatio", "type": "uint256"},
      {"internalType": "bool", "name": "crossChainLoan", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

export const USDC_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// cETH Token ABI (same as ERC20)
export const CETH_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// Custom hooks for contract interactions
export function useLendingPool() {
  return useContract({
    address: CONTRACT_ADDRESSES.LENDING_POOL,
    abi: LENDING_POOL_ABI
  })
}

export function useUSDC() {
  return useContract({
    address: CONTRACT_ADDRESSES.USDC,
    abi: USDC_ABI
  })
}

export function useCETH() {
  return useContract({
    address: CONTRACT_ADDRESSES.CETH,
    abi: CETH_ABI
  })
}

// Hook for getting pool status
export function usePoolStatus() {
  return useContractRead({
    address: CONTRACT_ADDRESSES.LENDING_POOL,
    abi: LENDING_POOL_ABI,
    functionName: 'getPoolStatus',
    watch: true
  })
}

// Hook for getting Pyth APY
export function usePythAPY() {
  return useContractRead({
    address: CONTRACT_ADDRESSES.LENDING_POOL,
    abi: LENDING_POOL_ABI,
    functionName: 'getPythAPY',
    watch: true
  })
}

// Hook for getting lender info
export function useLenderInfo(address) {
  return useContractRead({
    address: CONTRACT_ADDRESSES.LENDING_POOL,
    abi: LENDING_POOL_ABI,
    functionName: 'lenders',
    args: [address],
    watch: true
  })
}

// Hook for getting borrower info
export function useBorrowerInfo(address) {
  return useContractRead({
    address: CONTRACT_ADDRESSES.LENDING_POOL,
    abi: LENDING_POOL_ABI,
    functionName: 'borrowers',
    args: [address],
    watch: true
  })
}

// Hook for getting USDC balance
export function useUSDCBalance(address) {
  return useContractRead({
    address: CONTRACT_ADDRESSES.USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true
  })
}

// Utility functions
export function formatUSDC(amount) {
  if (!amount) return '0.00'
  return formatUnits(amount, 6)
}

export function formatAPY(apyValue) {
  if (!apyValue) return '0.00%'
  return `${(Number(apyValue) / 100).toFixed(2)}%`
}

export function parseUSDC(amount) {
  return parseUnits(amount || '0', 6)
}

export function parseAPY(apy) {
  return Math.floor(parseFloat(apy) * 100)
}
