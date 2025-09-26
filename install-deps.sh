#!/bin/bash

echo "🚀 Installing all necessary dependencies for Lending Protocol..."

# Install main dependencies
echo "📦 Installing main dependencies..."
npm install --legacy-peer-deps

# Install additional required packages
echo "📦 Installing additional packages..."
npm install pino-pretty@^10.2.0 --legacy-peer-deps
npm install @pythnetwork/pyth-sdk-js@^0.3.0 --legacy-peer-deps
npm install axios@^1.6.0 --legacy-peer-deps

# Install OpenZeppelin contracts for smart contracts
echo "📦 Installing OpenZeppelin contracts..."
npm install @openzeppelin/contracts@^4.9.0 --legacy-peer-deps

# Install additional dev dependencies
echo "📦 Installing dev dependencies..."
npm install @types/react@^18.0.0 @types/react-dom@^18.0.0 --save-dev --legacy-peer-deps

echo "✅ All dependencies installed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000/demo"
echo "3. Or deploy contracts and use: http://localhost:3000"
echo ""
echo "🏆 Your lending protocol is ready for the hackathon!"
