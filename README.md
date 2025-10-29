# Token Minting DApp dengan B402 Payment Gateway

Aplikasi decentralized untuk minting ERC20 token dengan sistem pembayaran menggunakan B402 payment gateway. Proyek ini terdiri dari smart contract, backend NestJS, dan frontend React.

## 🏗️ Struktur Proyek

```
├── contracts/          # Smart contracts Solidity
│   └── t.sol          # ERC20 token contract (MyToken)
├── server/            # Backend NestJS
│   ├── src/
│   │   ├── mint.service.ts    # Service untuk minting token
│   │   ├── mint.controller.ts # API endpoint
│   │   └── main.ts           # Entry point
│   └── .env          # Environment variables
├── client/           # Frontend React + Vite
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── lib/             # Utility functions
│   │   ├── config.ts        # Konfigurasi aplikasi
│   │   └── App.tsx          # Main component
│   └── package.json
└── README.md
```

## 🚀 Fitur Utama

- **ERC20 Token Minting**: Contract dengan supply maksimal 10,000 token
- **Payment Gateway**: Integrasi dengan B402 untuk pembayaran USDT/USDC/BUSD
- **Wallet Integration**: Support MetaMask dan wallet lainnya via WalletConnect
- **Real-time Supply**: Tracking supply token yang tersisa
- **Responsive UI**: Interface modern dengan Tailwind CSS

## 📋 Prerequisites

- Node.js 18+
- pnpm atau npm
- MetaMask atau wallet yang kompatibel
- BSC Testnet/Mainnet access

## 🛠️ Setup dan Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd <project-name>
```

### 2. Install Dependencies

**Backend:**

```bash
cd server
pnpm install
```

**Frontend:**

```bash
cd client
pnpm install
```

### 3. Deploy Smart Contract

#### Menggunakan Remix IDE:

1. **Buka Remix IDE**: https://remix.ethereum.org
2. **Upload Contract**:
   - Buat file baru `MyToken.sol`
   - Copy paste kode dari `contracts/t.sol`
3. **Compile Contract**:
   - Pilih Solidity Compiler (0.8.20+)
   - Enable optimization (200 runs)
   - Compile contract
4. **Deploy Contract**:
   - Pilih "Deploy & Run Transactions"
   - Environment: "Injected Provider - MetaMask"
   - Network: BSC Mainnet/Testnet
   - Deploy contract
5. **Copy Address**: Simpan alamat contract yang ter-deploy

#### Export ABI untuk Backend:

1. **Di Remix**: Setelah compile, buka folder `contracts/artifacts/MyToken.sol/`
2. **Download MyToken.json**: File ini berisi ABI dan bytecode
3. **Copy ke Backend**: Letakkan file `MyToken.json` di folder `server/src/`

### 4. Setup Reown/WalletConnect Project ID (GRATIS)

Frontend menggunakan Reown (formerly WalletConnect) untuk koneksi wallet. Anda perlu Project ID gratis:

#### Cara Mendapatkan Project ID:

1. **Kunjungi**: https://cloud.reown.com
2. **Sign Up/Login**: Buat akun gratis
3. **Create New Project**:
   - Project Name: "MyToken Mint DApp"
   - Project Type: "App"
4. **Copy Project ID**: Akan dapat ID seperti `a1b2c3d4e5f6...`

### 5. Konfigurasi Environment

**Frontend (.env):**

```env
# Buat file client/.env
VITE_PROJECT_ID=your_reown_project_id_here
```

**Backend (.env):**

```env
PORT=3001
BSC_RPC_URL=https://bsc-dataseed.binance.org
PRIVATE_KEY=your_64_char_private_key_here
MINT_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

**Frontend (config.ts):**

```typescript
export const B402_CONFIG = {
  MERCHANT_ADDRESS: "0xYourBSCWalletAddressHere",
  // ... other config
};

export const MINT_CONFIG = {
  TOKEN_CONTRACT: "0xYourDeployedContractAddress",
  // ... other config
};
```

### 6. Jalankan Aplikasi

**Backend:**

```bash
cd server
pnpm run start:dev
```

**Frontend:**

```bash
cd client
pnpm run dev
```

Aplikasi akan berjalan di:

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## 🔧 Konfigurasi Penting

### Contract Ownership

Pastikan wallet yang private key-nya ada di backend adalah owner dari contract. Ini diperlukan untuk fungsi `mint()`.

### B402 Configuration

Update `MERCHANT_ADDRESS` di `client/src/config.ts` dengan alamat wallet merchant Anda yang terdaftar di B402.

### Network Configuration

Proyek ini dikonfigurasi untuk BSC (Binance Smart Chain). Untuk network lain, update:

- RPC URL di backend
- Chain ID di frontend
- Token addresses untuk payment

## 📁 File ABI/JSON yang Diperlukan

### ✅ **DIPERLUKAN di Backend**

File `MyToken.json` **WAJIB** ada di `server/src/` karena:

1. **Contract Interaction**: Backend perlu ABI untuk berinteraksi dengan smart contract
2. **Function Calls**: Untuk memanggil fungsi `mint()`, `totalSupply()`, dll
3. **Type Safety**: Ethers.js memerlukan ABI untuk type checking

### Cara Mendapatkan MyToken.json:

**Dari Remix:**

```
contracts/artifacts/MyToken.sol/MyToken.json
```

**Struktur file yang diperlukan:**

```json
{
  "abi": [
    {
      "inputs": [],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
    // ... other ABI entries
  ],
  "bytecode": "0x...",
  "deployedBytecode": "0x..."
}
```

### ❌ **TIDAK Diperlukan di Frontend**

Frontend tidak memerlukan ABI karena:

- Hanya melakukan pembayaran via B402
- Tidak berinteraksi langsung dengan contract
- Contract interaction dilakukan di backend

## 🔄 Flow Aplikasi

1. **User Connect Wallet**: Via WalletConnect/MetaMask
2. **Select Amount**: Pilih jumlah token (1-100)
3. **Choose Payment**: Pilih USDT/USDC/BUSD
4. **Sign Payment**: Authorize payment via B402
5. **Backend Verification**: Verifikasi transaksi payment
6. **Mint Token**: Backend mint token ke wallet user
7. **Success**: User menerima token di wallet

## 🧪 Testing

**Backend:**

```bash
cd server
pnpm run test
```

**Frontend:**

```bash
cd client
pnpm run build
```

## 📦 Production Build

**Backend:**

```bash
cd server
pnpm run build
pnpm run start:prod
```

**Frontend:**

```bash
cd client
pnpm run build
pnpm run preview
```

## 🔒 Security Notes

- Private key harus disimpan aman (gunakan environment variables)
- Validasi semua input di backend
- Rate limiting untuk API endpoints
- Audit smart contract sebelum mainnet deployment

## 🐛 Troubleshooting

### Reown/WalletConnect Issues:

- **Error "Invalid Project ID"**: Pastikan `VITE_PROJECT_ID` benar di `.env`
- **Wallet tidak connect**: Check Project ID dan network configuration
- **"Failed to fetch"**: Pastikan domain terdaftar di Reown dashboard

### Contract Deployment Issues:

- Pastikan wallet memiliki BNB untuk gas fees
- Verify contract address setelah deployment
- Check network yang benar (testnet vs mainnet)

### Backend Issues:

- Pastikan `MyToken.json` ada di `server/src/`
- Verify private key format (64 karakter hex)
- Check RPC URL accessibility

### Frontend Issues:

- Update contract address di config
- Verify B402 merchant address
- Check wallet network (BSC)
- Pastikan file `.env` ada dengan `VITE_PROJECT_ID`

## 📞 Support

Untuk pertanyaan atau issues, silakan buat issue di repository ini atau hubungi tim development.

## 📄 License

MIT License - lihat file LICENSE untuk detail.
