// BSC Network Configuration
export const BSC_CONFIG = {
    CHAIN_ID: 56,
    CHAIN_NAME: 'BNB Smart Chain',
    RPC_URLS: [
        'https://bsc-dataseed.binance.org',
        'https://bsc-dataseed1.defibit.io',
        'https://bsc-dataseed1.ninicoin.io',
    ],
    BLOCK_EXPLORER: 'https://bscscan.com',
    NATIVE_CURRENCY: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18,
    },
} as const;

// B402 Payment Configuration
export const B402_CONFIG = {
    MERCHANT_ADDRESS: "0xe7b97053Fc48CadC5711A8dB32ccA422C7ab43e5",
    FACILITATOR_URL: "https://facilitator.b402.ai",
    RELAYER_ADDRESS: "0xE1C2830d5DDd6B49E9c46EbE03a98Cb44CD8eA5a",
    CHAIN_ID: BSC_CONFIG.CHAIN_ID,
    TOKENS: {
        USDT: "0x55d398326f99059fF775485246999027B3197955",
        USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        USD1: "0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d",
    },
} as const;

// Mint Configuration
export const MINT_CONFIG = {
    PRICE_PER_TOKEN: 10, // $10 per token
    MIN_MINT: 1,
    MAX_MINT: 100,
    TOTAL_SUPPLY: 10000,
    TOKEN_CONTRACT: "0x7b4D1b473A265eE62b177D051E8d05116D761369",
    PACKAGES: [
        { id: 1, price: 1, tokens: 0.1, label: '$1 Package' },
        { id: 5, price: 5, tokens: 0.5, label: '$5 Package' },
        { id: 10, price: 10, tokens: 1, label: '$10 Package' },
        { id: 100, price: 100, tokens: 10, label: '$100 Package' },
    ],
} as const;

// Wagmi Configuration
export const WAGMI_CONFIG = {
    PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID || "",
    APP_NAME: 'MY TOKEN Mint DApp',
    APP_DESCRIPTION: 'Mint MY TOKEN with B402 Payment Gateway',
} as const;

// Validation
if (!WAGMI_CONFIG.PROJECT_ID && typeof window !== 'undefined') {
    console.warn('NEXT_PUBLIC_PROJECT_ID is not set. Wallet connection may not work properly.');
}