import { ethers } from 'ethers';

// MyToken Contract ABI for supply queries (updated for new contract)
const SUPPLY_ABI = [
    "function getRemainingAllocations() external view returns (uint256, uint256, uint256, uint256)",
    "function getDistributionStatus() external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function publicMinted() external view returns (uint256)",
    "function MINT_ALLOCATION() external view returns (uint256)",
    "function mintingEnabled() external view returns (bool)",
    "function publicSaleEnabled() external view returns (bool)",
    "function tokenPrice() external view returns (uint256)",
    "function calculatePayment(uint256 tokenAmount, address paymentToken) external view returns (uint256)"
];

// Contract configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x4720f69e8E3c06AcD5F6711061e8d3f2916706AF';
const BSC_RPC_URL = process.env.BSC_RPC_URL || process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';

export async function getRemainingSupply(): Promise<number> {
    try {
        // First validate if contract exists
        if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            console.warn('Contract address not configured, using fallback');
            return 7500;
        }

        const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);

        // Check if contract has code
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            console.warn('Contract address has no code, using fallback');
            return 7500;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, SUPPLY_ABI, provider);

        // Get remaining public allocation
        const [, , , publicRemaining] = await contract.getRemainingAllocations();

        // Convert from wei to tokens (divide by 1e18)
        return Number(ethers.formatEther(publicRemaining));
    } catch (error) {
        console.error('Error fetching remaining supply:', error);
        // Fallback to mock data if contract call fails
        return 7500; // Default remaining tokens
    }
}

export async function getPublicMinted(): Promise<number> {
    try {
        if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            return 0;
        }

        const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);

        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            return 0;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, SUPPLY_ABI, provider);

        const publicMinted = await contract.publicMinted();
        return Number(ethers.formatEther(publicMinted));
    } catch (error) {
        console.error('Error fetching public minted:', error);
        return 0;
    }
}

export async function getTotalSupply(): Promise<number> {
    try {
        if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            return 700000;
        }

        const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);

        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            return 700000;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, SUPPLY_ABI, provider);

        const allocation = await contract.MINT_ALLOCATION();
        return Number(ethers.formatEther(allocation));
    } catch (error) {
        console.error('Error fetching total allocation:', error);
        return 700000; // 70% of 1M tokens
    }
}

export async function getMintedSupply(): Promise<number> {
    return getPublicMinted();
}

export async function getTokenPrice(): Promise<number> {
    try {
        if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            return 0.05; // Default 0.05 USDT per token (1 USDT = 20 MTK)
        }

        const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            return 0.05;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, SUPPLY_ABI, provider);
        const price = await contract.tokenPrice();
        return Number(ethers.formatEther(price));
    } catch (error) {
        console.error('Error fetching token price:', error);
        return 0.05; // Fallback: 0.05 USDT per token (1 USDT = 20 MTK)
    }
}

export async function calculatePaymentAmount(tokenAmount: number, paymentToken: string): Promise<number> {
    try {
        if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            return tokenAmount * 0.05; // 0.05 USDT per token (1 USDT = 20 MTK)
        }

        const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            return tokenAmount * 0.05;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, SUPPLY_ABI, provider);

        // Token addresses on BSC
        const tokenAddresses: { [key: string]: string } = {
            'USDT': '0x55d398326f99059fF775485246999027B3197955',
            'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            'USD1': '0x55d398326f99059fF775485246999027B3197955'
        };

        const paymentTokenAddress = tokenAddresses[paymentToken];
        if (!paymentTokenAddress) {
            throw new Error(`Unsupported payment token: ${paymentToken}`);
        }

        const tokenAmountWei = ethers.parseEther(tokenAmount.toString());
        const paymentAmount = await contract.calculatePayment(tokenAmountWei, paymentTokenAddress);

        return Number(ethers.formatEther(paymentAmount));
    } catch (error) {
        console.error('Error calculating payment amount:', error);
        return tokenAmount * 0.05; // Fallback: 0.05 USDT per token (1 USDT = 20 MTK)
    }
}

export async function getMintingStatus(): Promise<{
    enabled: boolean;
    remaining: number;
    minted: number;
    total: number;
    progress: number;
    publicSaleEnabled?: boolean;
    tokenPrice?: number;
}> {
    try {
        if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            return {
                enabled: true,
                remaining: 7500,
                minted: 0,
                total: 700000,
                progress: 0
            };
        }

        const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);

        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            return {
                enabled: true,
                remaining: 7500,
                minted: 0,
                total: 700000,
                progress: 0
            };
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, SUPPLY_ABI, provider);

        const [enabled, publicSaleEnabled, remaining, minted, total, tokenPrice] = await Promise.all([
            contract.mintingEnabled(),
            contract.publicSaleEnabled(),
            getRemainingSupply(),
            getPublicMinted(),
            getTotalSupply(),
            getTokenPrice()
        ]);

        const progress = total > 0 ? (minted / total) * 100 : 0;

        return {
            enabled,
            remaining,
            minted,
            total,
            progress,
            publicSaleEnabled,
            tokenPrice
        };
    } catch (error) {
        console.error('Error fetching minting status:', error);
        return {
            enabled: true,
            remaining: 7500,
            minted: 0,
            total: 700000,
            progress: 0
        };
    }
}