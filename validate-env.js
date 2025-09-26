#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required API keys and environment variables are configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Environment Configuration...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('Please create .env.local file with required environment variables.');
  console.log('You can copy from .env.local.example and fill in your values.');
  process.exit(1);
}

console.log('✅ .env.local file found');

// Load environment variables from .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key] = valueParts.join('=');
    }
  }
});

// Merge with process.env
const fullEnv = { ...process.env, ...envVars };

// Required environment variables
const requiredVars = [
  {
    name: 'NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID',
    description: 'WalletConnect Project ID',
    source: 'https://cloud.walletconnect.com/'
  },
  {
    name: 'PYTH_API_KEY',
    description: 'Pyth Network API Key',
    source: 'https://pyth.network/'
  },
  {
    name: 'WALRUS_API_KEY',
    description: 'Walrus Protocol API Key',
    source: 'https://walrus.com/'
  },
  {
    name: 'WALRUS_SECRET_KEY',
    description: 'Walrus Protocol Secret Key',
    source: 'https://walrus.com/'
  },
  {
    name: 'NEXT_PUBLIC_LENDING_POOL_ADDRESS',
    description: 'Lending Pool Contract Address',
    source: 'Deploy contract or use testnet address'
  },
  {
    name: 'NEXT_PUBLIC_USDC_ADDRESS',
    description: 'USDC Token Contract Address',
    source: 'Deploy contract or use testnet address'
  },
  {
    name: 'NEXT_PUBLIC_PYTH_ORACLE_ADDRESS',
    description: 'Pyth Oracle Contract Address',
    source: 'Deploy contract or use testnet address'
  }
];

// Optional but recommended variables
const optionalVars = [
  {
    name: 'INFURA_PROJECT_ID',
    description: 'Infura Project ID (enhanced RPC)',
    source: 'https://infura.io/'
  },
  {
    name: 'ALCHEMY_API_KEY',
    description: 'Alchemy API Key (enhanced RPC)',
    source: 'https://alchemy.com/'
  },
  {
    name: 'COINGECKO_API_KEY',
    description: 'CoinGecko API Key (fallback prices)',
    source: 'https://www.coingecko.com/en/api'
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    description: 'Sentry DSN (error tracking)',
    source: 'https://sentry.io/'
  }
];

// Contract addresses for integrated protocols
const protocolAddresses = [
  {
    name: 'NEXT_PUBLIC_WALRUS_STORAGE_ADDRESS',
    description: 'Walrus Storage Contract',
    protocol: 'Walrus Protocol'
  },
  {
    name: 'NEXT_PUBLIC_WALRUS_TOKEN_ADDRESS',
    description: 'Walrus Token Contract',
    protocol: 'Walrus Protocol'
  },
  {
    name: 'NEXT_PUBLIC_ROOTSTOCK_BRIDGE_ADDRESS',
    description: 'Rootstock Bridge Contract',
    protocol: 'Rootstock Bridge'
  },
  {
    name: 'NEXT_PUBLIC_MAKER_POT_ADDRESS',
    description: 'MakerDAO Pot Contract',
    protocol: 'MakerDAO'
  },
  {
    name: 'NEXT_PUBLIC_MAKER_DAI_ADDRESS',
    description: 'MakerDAO DAI Contract',
    protocol: 'MakerDAO'
  },
  {
    name: 'NEXT_PUBLIC_AAVE_V3_POOL_ADDRESS',
    description: 'Aave v3 Pool Contract',
    protocol: 'Aave v3'
  },
  {
    name: 'NEXT_PUBLIC_AAVE_V3_DATA_PROVIDER_ADDRESS',
    description: 'Aave v3 Data Provider',
    protocol: 'Aave v3'
  }
];

let allValid = true;

// Check required variables
console.log('📋 Checking Required Variables:');
requiredVars.forEach(({ name, description, source }) => {
  const value = fullEnv[name];
  if (!value || value === 'your-' + name.toLowerCase().replace('next_public_', '').replace(/_/g, '-') || value === '0x...') {
    console.log(`❌ ${name} - ${description}`);
    console.log(`   Source: ${source}`);
    allValid = false;
  } else {
    console.log(`✅ ${name} - ${description}`);
  }
});

console.log('\n📋 Checking Optional Variables:');
optionalVars.forEach(({ name, description, source }) => {
  const value = fullEnv[name];
  if (!value) {
    console.log(`⚠️  ${name} - ${description} (optional)`);
    console.log(`   Source: ${source}`);
  } else {
    console.log(`✅ ${name} - ${description}`);
  }
});

console.log('\n🔗 Checking Protocol Integration Addresses:');
protocolAddresses.forEach(({ name, description, protocol }) => {
  const value = fullEnv[name];
  if (!value || value === '0x...') {
    console.log(`⚠️  ${name} - ${description} (${protocol})`);
    console.log(`   Status: Not configured - will use fallback or disable feature`);
  } else {
    console.log(`✅ ${name} - ${description} (${protocol})`);
  }
});

// Network configuration check
console.log('\n🌐 Checking Network Configuration:');
const network = fullEnv.NEXT_PUBLIC_NETWORK;
const rpcUrl = fullEnv.NEXT_PUBLIC_RPC_URL;
const chainId = fullEnv.NEXT_PUBLIC_CHAIN_ID;

if (!network) {
  console.log('⚠️  NEXT_PUBLIC_NETWORK - Network not specified');
  allValid = false;
} else {
  console.log(`✅ NEXT_PUBLIC_NETWORK - ${network}`);
}

if (!rpcUrl) {
  console.log('⚠️  NEXT_PUBLIC_RPC_URL - RPC URL not specified');
  allValid = false;
} else {
  console.log(`✅ NEXT_PUBLIC_RPC_URL - ${rpcUrl}`);
}

if (!chainId) {
  console.log('⚠️  NEXT_PUBLIC_CHAIN_ID - Chain ID not specified');
  allValid = false;
} else {
  console.log(`✅ NEXT_PUBLIC_CHAIN_ID - ${chainId}`);
}

// Private key check (for deployment)
console.log('\n🔐 Checking Deployment Configuration:');
const privateKey = fullEnv.PRIVATE_KEY;
if (!privateKey || privateKey === 'your-private-key-here') {
  console.log('⚠️  PRIVATE_KEY - Private key not configured (required for deployment)');
} else {
  console.log('✅ PRIVATE_KEY - Configured');
}

// Summary
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('🎉 Environment configuration is complete!');
  console.log('You can now run the application with full functionality.');
} else {
  console.log('⚠️  Some required environment variables are missing.');
  console.log('Please configure them before deploying to production.');
  console.log('You can still run in demo mode with limited functionality.');
}

console.log('\n💡 Next Steps:');
console.log('1. Run "npm run dev" to start the development server');
console.log('2. Visit http://localhost:3000/demo for demo mode');
console.log('3. Visit http://localhost:3000 for full protocol mode');
console.log('4. Run "npm run build" to verify production build');

console.log('\n📖 For help with API keys, see COMPLETE_SETUP.md');
console.log('='.repeat(50));