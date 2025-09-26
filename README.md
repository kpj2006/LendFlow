# Lending Protocol - ETHGlobal Hackathon

A decentralized lending protocol with orderbook matching that protects small borrowers from APY spikes caused by large borrowers.

## 🚀 Features

- **Smart Orderbook Matching**: Different strategies for small vs whale borrowers
- **Pyth Network Integration**: Real-time APY reference rates
- **Walrus Protocol**: Decentralized data storage
- **Rootstock Protocol**: Bitcoin-secured smart contracts
- **Weighted APY Calculation**: Fair pricing for partial fills

## 🏗️ Architecture

### Smart Contracts
- `LendingPool.sol`: Main lending protocol contract
- `MockUSDC.sol`: ERC-20 token for testing
- `MockPythOracle.sol`: Mock Pyth price feed

### Frontend
- **Next.js 14** with React 18
- **Wagmi** for Ethereum interactions
- **RainbowKit** for wallet connection
- **Tailwind CSS** for styling

### Key Components
- `LenderInterface.jsx`: Add liquidity and set APY
- `BorrowerInterface.jsx`: Request loans
- `PoolStatus.jsx`: Real-time pool statistics
- `OrderbookVisualizer.jsx`: Live matching simulation

## 🎯 Core Logic

### Small Borrowers (< 1,000 USDC)
- Matched from **lowest APY to highest APY**
- Protected from whale impact
- Get best available rates

### Whale Borrowers (≥ 1,000 USDC)
- Matched from **highest APY to lowest APY**
- Pay weighted average APY
- Impact market rates

### Example Scenario
```
Initial Pool:
- Lender A: 50 USDC @ 3.6%
- Lender B: 50 USDC @ 4.0%

Step 1: Small Borrower X wants 30 USDC
→ Matches with Lender A @ 3.6%
→ Remaining: A=20 USDC, B=50 USDC

Step 2: Whale Borrower Y wants 70 USDC
→ Takes 50 USDC from B @ 4.0%
→ Takes 20 USDC from A @ 3.6%
→ Weighted APY: (50×4.0 + 20×3.6)/70 ≈ 3.94%
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Git
- MetaMask or compatible wallet

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd lending-protocol
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

4. **Deploy smart contracts**
```bash
# Compile contracts
npm run compile

# Deploy to local network
npx hardhat node
# In another terminal:
npm run deploy
```

5. **Start the frontend**
```bash
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_LENDING_POOL_ADDRESS`: Deployed LendingPool contract address
- `NEXT_PUBLIC_USDC_ADDRESS`: USDC token contract address
- `NEXT_PUBLIC_PYTH_ORACLE_ADDRESS`: Pyth Oracle contract address
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: WalletConnect project ID

### Network Configuration
The protocol is configured for Rootstock network:
- **Mainnet**: Chain ID 30
- **Testnet**: Chain ID 31

## 📊 Protocol Integration

### Pyth Network
- Real-time USDC/USD price feeds
- APY reference rates
- Market volatility indicators

### Walrus Protocol
- Orderbook data storage
- Historical matching events
- User preference persistence

### Rootstock Protocol
- Bitcoin-secured smart contracts
- Lower transaction costs
- Enhanced security

## 🧪 Testing

### Smart Contract Tests
```bash
npm run test
```

### Frontend Testing
```bash
npm run lint
```

## 🚀 Deployment

### Smart Contracts
```bash
# Deploy to Rootstock Testnet
npm run deploy

# Deploy to Rootstock Mainnet
npx hardhat run scripts/deploy.js --network rootstock
```

### Frontend
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📈 Feasibility Assessment

### ✅ 1-Day Completion Feasible
- **Smart Contracts**: 4-6 hours
- **Frontend Components**: 6-8 hours
- **Integration & Testing**: 2-4 hours
- **Total**: 12-18 hours

### Key Success Factors
1. **Mock Contracts**: Use mock implementations for rapid development
2. **Simplified UI**: Focus on core functionality
3. **Modular Architecture**: Reusable components
4. **Clear Documentation**: Easy setup and deployment

## 🔒 Security Considerations

- **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
- **Access Control**: Owner-only functions for critical operations
- **Input Validation**: Comprehensive parameter validation
- **Overflow Protection**: SafeMath operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🏆 Hackathon Submission

This project demonstrates:
- **Innovation**: Novel orderbook matching for lending
- **Integration**: Multiple protocol integrations
- **User Experience**: Intuitive interface with real-time updates
- **Technical Excellence**: Clean, well-documented code

## 📞 Support

For questions or support, please open an issue on GitHub or contact the team.

---

**Built with ❤️ for ETHGlobal Hackathon**
