import { ethers } from 'ethers';

export enum MintType {
    AIRDROP = 'airdrop',
    BAYC = 'bayc',
    LIQUIDITY = 'liquidity',
    PUBLIC = 'public'
}

// MyToken Contract ABI
const MYTOKEN_ABI = [
    "function mintAirdrop(address to, uint256 amount) external",
    "function mintBayc(address to, uint256 amount) external",
    "function mintLiquidity(address to, uint256 amount) external",
    "function disableMinting() external",
    "function getRemainingAllocations() external view returns (uint256, uint256, uint256, uint256)",
    "function getDistributionStatus() external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function mintingEnabled() external view returns (bool)",
    "function publicSaleEnabled() external view returns (bool)",
    "function owner() external view returns (address)"
];

export class MintService {
    private provider: ethers.JsonRpcProvider;
    private contract: ethers.Contract;
    private wallet: ethers.Wallet;

    constructor() {
        if (!process.env.BSC_RPC_URL || !process.env.CONTRACT_ADDRESS || !process.env.FACILITATOR_PRIVATE_KEY) {
            throw new Error('Missing required environment variables');
        }

        this.provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.FACILITATOR_PRIVATE_KEY, this.provider);
        this.contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, MYTOKEN_ABI, this.wallet);
    }

    async mintAirdrop(to: string, amount: string): Promise<string> {
        const amountWei = ethers.parseEther(amount);
        const tx = await this.contract.mintAirdrop(to, amountWei);
        await tx.wait();
        return tx.hash;
    }

    async mintBayc(to: string, amount: string): Promise<string> {
        const amountWei = ethers.parseEther(amount);
        const tx = await this.contract.mintBayc(to, amountWei);
        await tx.wait();
        return tx.hash;
    }

    async mintLiquidity(to: string, amount: string): Promise<string> {
        const amountWei = ethers.parseEther(amount);
        const tx = await this.contract.mintLiquidity(to, amountWei);
        await tx.wait();
        return tx.hash;
    }

    async disableMinting(): Promise<string> {
        const tx = await this.contract.disableMinting();
        await tx.wait();
        return tx.hash;
    }

    async getRemainingAllocations(): Promise<{
        airdrop: string;
        bayc: string;
        liquidity: string;
        public: string;
    }> {
        const [airdrop, bayc, liquidity, publicRemaining] = await this.contract.getRemainingAllocations();
        return {
            airdrop: ethers.formatEther(airdrop),
            bayc: ethers.formatEther(bayc),
            liquidity: ethers.formatEther(liquidity),
            public: ethers.formatEther(publicRemaining)
        };
    }

    async getDistributionStatus(): Promise<{
        totalMinted: string;
        airdropProgress: number;
        baycProgress: number;
        liquidityProgress: number;
        publicProgress: number;
    }> {
        const [totalMinted, airdropProgress, baycProgress, liquidityProgress, publicProgress] =
            await this.contract.getDistributionStatus();

        return {
            totalMinted: ethers.formatEther(totalMinted),
            airdropProgress: Number(airdropProgress),
            baycProgress: Number(baycProgress),
            liquidityProgress: Number(liquidityProgress),
            publicProgress: Number(publicProgress)
        };
    }

    async getMintingStatus(): Promise<{
        mintingEnabled: boolean;
        publicSaleEnabled: boolean;
        owner: string;
    }> {
        const [mintingEnabled, publicSaleEnabled, owner] = await Promise.all([
            this.contract.mintingEnabled(),
            this.contract.publicSaleEnabled(),
            this.contract.owner()
        ]);

        return {
            mintingEnabled,
            publicSaleEnabled,
            owner
        };
    }

    async verifyTransaction(txHash: string): Promise<{
        success: boolean;
        blockNumber?: number;
        gasUsed?: string;
        status?: number;
    }> {
        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            if (!receipt) {
                return { success: false };
            }

            return {
                success: receipt.status === 1,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status ?? undefined
            };
        } catch (error) {
            console.error('Error verifying transaction:', error);
            return { success: false };
        }
    }

    async getWalletBalance(): Promise<string> {
        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Error getting wallet balance:', error);
            throw new Error('Failed to get wallet balance');
        }
    }

    async getContractBalance(): Promise<string> {
        try {
            const balance = await this.provider.getBalance(process.env.CONTRACT_ADDRESS!);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Error getting contract balance:', error);
            throw new Error('Failed to get contract balance');
        }
    }

    async getHealth(): Promise<{
        rpcConnected: boolean;
        contractConnected: boolean;
        walletConnected: boolean;
        blockNumber?: number;
    }> {
        try {
            const blockNumber = await this.provider.getBlockNumber();
            const owner = await this.contract.owner();
            const walletAddress = await this.wallet.getAddress();

            return {
                rpcConnected: true,
                contractConnected: !!owner,
                walletConnected: !!walletAddress,
                blockNumber
            };
        } catch (error) {
            console.error('Health check error:', error);
            return {
                rpcConnected: false,
                contractConnected: false,
                walletConnected: false
            };
        }
    }
}

// Singleton instance
let mintServiceInstance: MintService | null = null;

export function getMintService(): MintService {
    if (!mintServiceInstance) {
        mintServiceInstance = new MintService();
    }
    return mintServiceInstance;
}