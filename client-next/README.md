# MY TOKEN - B402 Gasless DApp

A Next.js DApp for minting MY TOKEN using B402 Protocol for gasless transactions.

## 🚀 Features

### B402 Gasless Mode

- **No BNB Required**: Users don't need BNB for gas fees
- **No Wallet Connection**: Just enter BSC address manually
- **Backend Signing**: Facilitator service handles all blockchain interactions
- **Instant Processing**: No wallet popups or manual confirmations
- **Agent-Friendly**: Perfect for automation and programmatic access

## 🏗️ Architecture

```
User Input (BSC Address)
    ↓
Payment Selection (USDT/USDC/USD1)
    ↓
B402 Payment Processing (Backend)
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

Edit `.env.local`:

```env
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
FACILITATOR_PRIVATE_KEY=your_facilitator_private_key
CONTRACT_ADDRESS=your_token_contract_address
```

3. **Run Development Server**

```bash
npm run dev
```

## 📁 Key Files

### B402 Implementation

- `src/lib/b402-facilitator.ts` - Core B402 facilitator service
- `src/hooks/useB402Payment.ts` - Payment processing hook
- `src/app/api/b402-payment/route.ts` - B402 payment API
- `src/app/api/mint-gasless/route.ts` - Gasless minting API

### Components

- `src/components/MintForm.tsx` - Main minting interface
- `src/components/PaymentModal.tsx` - B402 payment modal
- `src/components/GaslessInfo.tsx` - Information component

## 🔄 User Flow

1. **Enter BSC Address**: User inputs their BSC wallet address
2. **Select Package**: Choose token amount and price
3. **Payment Processing**: B402 handles USDT/USDC/USD1 payment
4. **Gasless Mint**: Facilitator mints tokens without user gas fees
5. **Token Delivery**: Tokens sent directly to user's address

## 🛡️ Security

- Payment verification through B402 protocol
- Address validation before processing
- Facilitator wallet isolation
- Error handling and transaction monitoring

## 🌐 Deployment

The app can be deployed to any platform supporting Next.js:

- Vercel
- Netlify
- Railway
- Self-hosted

## 📚 B402 Protocol

Learn more about B402:

- [B402 Documentation](https://docs.b402.ai/)
- [B402 Concepts](https://docs.b402.ai/concepts/facilitator)
- [GitHub Repository](https://github.com/Vistara-Labs/b402/)

## 🔗 Comparison

| Feature           | Traditional Wallet   | B402 Gasless |
| ----------------- | -------------------- | ------------ |
| Gas Fees          | User pays BNB        | Zero fees    |
| Wallet Connection | Required             | Not needed   |
| User Experience   | Multiple popups      | Single flow  |
| Automation        | Difficult            | Easy         |
| Speed             | Slow (confirmations) | Fast         |
