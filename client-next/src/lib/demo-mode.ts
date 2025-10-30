// Demo mode configuration
export const DEMO_MODE = true; // Set to false when real contract is deployed

export const DEMO_DATA = {
    totalSupply: 700000,
    publicMinted: 2500,
    remaining: 697500,
    progress: 0.36,
    mintingEnabled: true,
    facilitatorAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e'
};

// Check if we should use demo mode
export function shouldUseDemoMode(): boolean {
    // Use demo mode if:
    // 1. DEMO_MODE is true, OR
    // 2. Contract address is not properly configured
    const contractAddress = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    return DEMO_MODE || !contractAddress || contractAddress === '0x0000000000000000000000000000000000000000';
}