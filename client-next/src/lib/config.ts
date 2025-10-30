export const B402_CONFIG = {
    TOKENS: {
        USDT: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
        USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // BSC USDC  
        USD1: "0x55d398326f99059fF775485246999027B3197955", // Example USD1
    },
    FACILITATOR: {
        ADDRESS: process.env.FACILITATOR_ADDRESS || "0x0000000000000000000000000000000000000000",
        PRIVATE_KEY: process.env.FACILITATOR_PRIVATE_KEY || "",
    },
    CONTRACT: {
        ADDRESS: process.env.CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
        ABI: [], // Will be populated from MyToken.json
    },
    NETWORK: {
        BSC_RPC: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org/",
        CHAIN_ID: 56,
    }
};

