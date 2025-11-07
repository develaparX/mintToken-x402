# MY TOKEN - B402 Gasless Minting DApp

A Next.js DApp implementing B402 gasless protocol for seamless token minting on BSC. Users can mint tokens without needing BNB for gas fees through real USDT/USDC payments.

## 🚀 Key Features

### True Gasless Experience (B402 Protocol)

- **Zero Gas Fees**: Users never pay BNB - facilitator handles all gas costs
- **No Wallet Connection Required**: Simple BSC address input (optional wallet connect)
- **Real Payment Processing**: Actual USDT/USDC transfers, not simulated
- **One-Time Approval**: Approve once, then all future transactions are gasless
- **Mobile Optimized**: Perfect UX for mobile users and automation

### Smart Payment System

- **Multiple Tokens**: USDT, USDC, USD1 support on BSC
- **Flexible Packages**: $1 (20 tokens) to $100 (2000 tokens)
- **Real-time Supply**: Live tracking of remaining token allocation
- **Instant Processing**: Immediate token delivery after payment

### Advanced UI/UX

- **Anime-themed Design**: Beautiful background imagery
- **Wallet Auto-detection**: Automatically detects connected wallets
- **Payment Modal**: Streamlined payment flow with clear status
- **Success Tracking**: BSCScan integration for transaction verification

## 🏗️ B402 Architecture

```
User Experience Flow:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │ -> │  Payment Modal   │ -> │  Success Page   │
│ BSC Address +   │    │ Connect Wallet + │    │ Transaction +   │
│ Token Amount    │    │ Approve/Pay      │    │ BSCScan Link    │
└─────────────────┘    └──────────────────┘    └─────────────────┘

Technical Flow:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │ -> │    Backend       │ -> │  Blockchain     │
│ Wallet Connect  │    │ Payment Process  │    │ Gasless Mint    │
│ Approval Check  │    │ USDT Transfer    │    │ Token Delivery  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Setup

1. **Install Dependencies**

```bash
npm install
```

2. **Environment Variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Client-side accessible variables
NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed1.binance.org/
NEXT_PUBLIC_CONTRACT_ADDRESS=your_token_contract_address_here

# Server-side only variables
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
FACILITATOR_PRIVATE_KEY=your_facilitator_private_key_here
CONTRACT_ADDRESS=your_token_contract_address_here

# Token addresses
USD1_TOKEN_ADDRESS=your_usd1_token_address_here
```

3. **Run Development Server**

```bash
npm run dev
```

## 📁 Key Files

### Core B402 Implementation

- `src/lib/b402-facilitator.ts` - B402 gasless protocol implementation
- `src/lib/facilitator.ts` - Core facilitator service for gasless transactions
- `src/lib/permit-signer.ts` - EIP-2612 permit signing utilities
- `src/lib/supply.ts` - Real-time token supply management
- `src/hooks/useB402Payment.ts` - React hook for B402 payment flow

### API Routes

- `src/app/api/gasless-approval/route.ts` - True gasless payment with approval
- `src/app/api/purchase-gasless/route.ts` - Semi-gasless purchase endpoint
- `src/app/api/verify-payment/route.ts` - Payment verification system
- `src/app/api/mint/allocation/route.ts` - Token allocation tracking
- `src/app/api/mint/status/route.ts` - Mint status and supply checking

### UI Components

- `src/components/MintForm.tsx` - Main minting interface with wallet detection
- `src/components/PaymentModal.tsx` - Advanced payment processing modal
- `src/components/BSCApprovalModal.tsx` - One-time approval interface
- `src/components/PaymentInstructionsModal.tsx` - Manual payment instructions
- `src/components/MintSuccess.tsx` - Success confirmation with BSCScan links

## 🔄 User Flow

### Option 1: Auto Wallet Detection

1. **Wallet Auto-Connect**: App automatically detects connected wallet (MetaMask, etc.)
2. **Select Package**: Choose from $1 (20 tokens) to $100 (2000 tokens)
3. **Payment Modal**: Select payment token (USDT/USDC/USD1)
4. **One-Time Approval**: Approve facilitator to spend tokens (first time only)
5. **Gasless Payment**: Facilitator processes payment and mints tokens
6. **Success**: Tokens delivered, transaction hash provided

### Option 2: Manual Address Input

1. **Connect Wallet**: Click "Connect Wallet" in payment modal
2. **Select Package**: Choose token amount and payment method
3. **Approve & Pay**: Single transaction for approval and payment
4. **Gasless Mint**: Facilitator handles minting without user gas fees
5. **Token Delivery**: Tokens sent directly to connected wallet
6. **BSCScan Link**: View transaction on blockchain explorer

## 🛡️ Security

- EIP-2612 permit signatures for secure token transfers
- Address validation before processing
- Facilitator wallet isolation
- Payment verification and monitoring
- Error handling and transaction validation

## 🌐 Deployment

The app can be deployed to any platform supporting Next.js:

- **Vercel** (Recommended)
- **Netlify**
- **Railway**
- **Self-hosted**

### Environment Variables for Production

Make sure to set all required environment variables in your deployment platform.

## 💰 Token Packages

| Package | Tokens   | Price (USD) | Rate            |
| ------- | -------- | ----------- | --------------- |
| Micro   | 20 MTK   | $1          | 0.05 USDT/token |
| Small   | 100 MTK  | $5          | 0.05 USDT/token |
| Medium  | 200 MTK  | $10         | 0.05 USDT/token |
| Large   | 2000 MTK | $100        | 0.05 USDT/token |

**Pricing**: 1 USDT = 20 MTK (0.05 USDT per token)  
**Limits**: Min 1 token, Max 10,000 tokens per transaction

## 🛠️ Tech Stack

### Frontend

- **Next.js 16.0.1** with React 19.2.0
- **TypeScript 5** for type safety
- **Tailwind CSS 4** for styling
- **Ethers.js 6.15.0** for blockchain interaction
- **Lucide React** for icons

### Backend

- **Next.js API Routes** for serverless functions
- **BSC Integration** via RPC endpoints
- **Real Payment Processing** with USDT/USDC
- **Gasless Transaction Handling**

### Blockchain

- **Binance Smart Chain (BSC)**
- **MyToken.sol** - ERC20 with controlled distribution
- **OpenZeppelin** contracts for security
- **EIP-2612** permit signatures

## 🎯 MyToken.sol Features

### Token Distribution (1M Total Supply)

- **5% Airdrop** (50K tokens) - Community building
- **5% BAYC Community** (50K tokens) - NFT holder exclusive
- **20% Liquidity Pool** (200K tokens) - DEX trading
- **70% Public Mint** (700K tokens) - Available for purchase

### Smart Contract Capabilities

- **Multi-token Payments** (USDT, USDC, USD1)
- **Gasless Minting** via facilitator
- **Supply Management** with real-time tracking
- **Security Features** (ReentrancyGuard, Ownable)

## 🔗 Features Comparison

| Feature           | Traditional DApp   | B402 Implementation |
| ----------------- | ------------------ | ------------------- |
| Gas Fees          | User pays BNB      | **Zero fees** ✅    |
| Wallet Connection | Always required    | **Optional** ✅     |
| User Experience   | Multiple popups    | **Single flow** ✅  |
| Payment Methods   | Limited to ETH/BNB | **Multi-token** ✅  |
| Mobile Support    | Poor               | **Excellent** ✅    |
| Automation Ready  | Difficult          | **Perfect** ✅      |
| Speed             | Slow confirmations | **Instant** ✅      |

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment variables: `cp .env.example .env.local`
4. Configure your facilitator wallet and contract addresses
5. Run development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

## 📊 Live Demo Features

- **Real-time Supply Tracking** - See remaining tokens
- **Anime-themed UI** - Beautiful background imagery
- **Responsive Design** - Works on all devices
- **BSCScan Integration** - View transactions on explorer
- **Error Handling** - Clear feedback for all scenarios
