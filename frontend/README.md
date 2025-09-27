# DeFi Gaming Protocol

A gaming-themed DeFi lending protocol with fixed-APY orderbook and hybrid APY tracking. Built with Next.js, TypeScript, TailwindCSS, and Web3 integration.

## 🎮 Features

- **Gaming-Themed UI**: Pixelated, neon-colored interface inspired by games like GTA, Valorant, and CS
- **Advanced 3D Animations**: Immersive Three.js scenes with dynamic effects
- **DeFi Lending Protocol**: Complete lending and borrowing functionality
- **Fixed-APY Orderbook**: Lenders can set their preferred APY rates
- **Hybrid APY Tracking**: Combines Maker and Aave APY data
- **Real-time Dashboard**: Live protocol statistics and charts
- **Borrower Classification**: Automatic small/whale borrower detection
- **Interactive 3D Elements**: Matrix rain, morphing geometries, DNA helixes
- **Responsive Design**: Mobile-friendly gaming interface

## 🌟 3D Visual Effects

### Enhanced Gaming Scene Components

1. **Matrix Rain Effect**
   - 8,000 falling particles with neon colors
   - Dynamic HSL color spectrum (green-cyan)
   - Continuous vertical movement simulation
   - Additive blending for glow effects

2. **Morphing 3D Geometries**
   - Shape-shifting between box, sphere, torus, and octahedron
   - Automatic transitions every 3 seconds
   - Floating animation with distortion materials
   - Multi-axis rotation and position changes

3. **Spinning Ring Array**
   - 8 concentric rings with individual speeds
   - HSL color gradients across the spectrum
   - Complex multi-axis rotation patterns
   - Depth-based positioning system

4. **DNA Helix Structure**
   - 200 spherical particles in double helix pattern
   - Alternating neon blue and green colors
   - Smooth rotation and horizontal oscillation
   - Mathematical spiral positioning

5. **Glitch Effect Cube**
   - Random glitch intensity bursts
   - Color switching between yellow and red
   - Scale distortion during glitch states
   - Floating animation with sine wave motion

6. **Interactive 3D Text**
   - "DeFi Gaming Protocol" in Orbitron font
   - Floating animation with smooth movement
   - Neon pink coloring with bloom effects
   - Dynamic positioning in 3D space

7. **Enhanced Neon Grid**
   - Wave animation with vertex displacement
   - Real-time geometry manipulation
   - Pulsing opacity with sine wave patterns
   - 50x50 subdivision for smooth waves

8. **Dynamic Camera Movement**
   - Smooth circular camera motion
   - Automatic look-at target tracking
   - Sine/cosine-based position updates
   - Non-intrusive background movement

9. **Advanced Lighting System**
   - Ambient lighting with neon pink tint
   - Point lights in neon green and blue
   - Multiple light sources for depth
   - High-performance rendering settings

10. **Interactive Distortion Sphere**
    - Real-time mesh distortion effects
    - Metallic material with roughness control
    - Continuous morphing animation
    - Semi-transparent neon pink coloring

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/defi-gaming-protocol.git
cd defi-gaming-protocol
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your configuration
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

### Web3 Integration
- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **ConnectKit** - Wallet connection interface
- **Ethers.js** - Ethereum library

### 3D & Visualization
- **Three.js** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for Three.js
- **Recharts** - Chart library for React

### UI Components
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Clsx & Tailwind Merge** - Conditional styling

## 📁 Project Structure

\`\`\`
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Dashboard page
│   ├── lend/              # Lending page
│   ├── borrow/            # Borrowing page
│   ├── pool/              # Liquidity pool page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── ui/                # UI components
│   ├── three/             # Three.js components
│   ├── charts/            # Chart components
│   ├── orderbook/         # Orderbook components
│   └── providers/         # Context providers
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── styles/               # Global styles
\`\`\`

## 🎯 Core Features

### Landing Page
- Gaming-themed hero section with Three.js animations
- Protocol overview and statistics
- Quick navigation to main features
- Responsive design with neon aesthetics

### Dashboard
- Real-time protocol statistics
- Hybrid APY tracking chart (Maker + Aave)
- Total liquidity and utilization metrics
- Live orderbook preview
- Protocol health indicators

### Lending Hub
- USDC deposit form with APY selection
- Risk-based APY slider (5-9% range)
- Projected returns calculator
- Current orderbook display
- Transaction status notifications

### Borrowing Hub
- Loan amount calculator
- Automatic borrower type detection (Small 🪙 / Whale 🐋)
- Matched lenders preview with weighted APY
- Real-time liquidity matching
- Transaction execution interface

### Liquidity Pool
- Sortable orderbook table
- Real-time order status updates
- Advanced filtering and search
- Lender rankings and statistics
- Quick match functionality

## 🔧 Smart Contract Integration

### Contract Functions
\`\`\`solidity
// Get current stable APY from Maker + Aave
function getStableAPY() external view returns (uint256)

// Lend USDC with chosen APY
function lend(uint256 amount, uint256 apy) external

// Borrow USDC (auto-matched with lenders)
function borrow(uint256 amount) external

// Get current orderbook
function getOrderbook() external view returns (Order[] memory)
\`\`\`

### Hooks Usage
\`\`\`typescript
// Get stable APY
const { apy, isLoading } = useStableAPY()

// Get orderbook data
const { orderbook } = useOrderbook()

// Lend funds
const { lend, isLoading } = useLend()
lend("1000", 6.5) // $1000 at 6.5% APY

// Borrow funds
const { borrow, isLoading } = useBorrow()
borrow("500") // $500 USDC
\`\`\`

## 🎨 Gaming Theme

### Color Palette
- **Neon Pink**: \`#ff0080\` - Primary actions
- **Neon Blue**: \`#0080ff\` - Secondary actions
- **Neon Green**: \`#00ff80\` - Success/Available
- **Neon Yellow**: \`#ffff00\` - Warnings
- **Dark Background**: \`#0a0a0a\` - Main background

### Typography
- **Orbitron**: Primary gaming font
- **Courier New**: Monospace for addresses/numbers

### Visual Effects
- Neon glows and shadows
- Matrix-style grid backgrounds
- Floating 3D elements
- Pulsing animations
- Hover scale effects

## 🔒 Security Features

- Wallet connection with multiple providers
- Contract interaction error handling
- Input validation and sanitization
- Transaction status monitoring
- Risk warnings and disclaimers

## 🚀 Deployment

### Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

### Environment Variables
Required for production:
- \`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID\`
- \`NEXT_PUBLIC_CONTRACT_ADDRESS\`
- \`NEXT_PUBLIC_CHAIN_ID\`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎮 Game On!

Ready to revolutionize DeFi with gaming aesthetics? Start the development server and begin your journey into the future of decentralized finance!

\`\`\`bash
npm install && npm run dev
\`\`\`

---

Built with ❤️ by the DeFi Gaming Protocol team