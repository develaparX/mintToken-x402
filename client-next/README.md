# MY TOKEN - Token Minting DApp

A Next.js DApp for minting MY TOKEN with gasless transactions on BSC.

## 🚀 Features

### Gasless Minting

- **No BNB Required**: Users don't need BNB for gas fees
- **Simple Interface**: Just enter BSC address to receive tokens
- **Multiple Payment Options**: Support for USDT, USDC, and USD1
- **Instant Processing**: Fast token delivery to user address
- **Clean UI**: Minimalist design focused on core functionality

## 🏗️ Architecture

```
User Input (BSC Address)
    ↓
Payment Selection (USDT/USDC/USD1)
    ↓
Payment Processing (Backend)
    ↓
Gasless Mint (Facilitator Wallet)
    ↓
Tokens Sent to User Address
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

### Core Implementation

- `src/lib/facilitator.ts` - Core facilitator service for gasless transactions
- `src/lib/mint-service.ts` - Token minting service
- `src/lib/permit-signer.ts` - EIP-2612 permit signing utilities
- `src/lib/supply.ts` - Token supply management

### API Routes

- `src/app/api/purchase-gasless/route.ts` - Gasless purchase endpoint
- `src/app/api/mint/allocation/route.ts` - Token allocation API
- `src/app/api/mint/status/route.ts` - Mint status checking
- `src/app/api/verify-payment/route.ts` - Payment verification

### Components

- `src/components/MintForm.tsx` - Main minting interface
- `src/components/MintSuccess.tsx` - Success confirmation modal
- `src/components/PaymentModal.tsx` - Payment processing modal

## 🔄 User Flow

1. **Enter BSC Address**: User inputs their BSC wallet address
2. **Select Package**: Choose token amount (100K, 500K, 1M, 5M MTK)
3. **Payment Processing**: Backend handles USDT/USDC/USD1 payment
4. **Gasless Mint**: Facilitator mints tokens without user gas fees
5. **Token Delivery**: Tokens sent directly to user's address
6. **Success Confirmation**: Transaction hash and details displayed

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

| Package    | Tokens   | Price (USD) |
| ---------- | -------- | ----------- |
| Starter    | 100K MTK | $10         |
| Popular    | 500K MTK | $45         |
| Pro        | 1M MTK   | $85         |
| Enterprise | 5M MTK   | $400        |

## 🔗 Features Comparison

| Feature           | Traditional DApp     | This Implementation |
| ----------------- | -------------------- | ------------------- |
| Gas Fees          | User pays BNB        | Zero fees           |
| Wallet Connection | Required             | Not needed          |
| User Experience   | Multiple popups      | Single flow         |
| Payment Methods   | Limited              | USDT/USDC/USD1      |
| Speed             | Slow (confirmations) | Fast                |
| Mobile Friendly   | Limited              | Fully responsive    |
