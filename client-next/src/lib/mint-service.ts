import { ethers } from 'ethers';
import MyTokenABI from '../MyToken.json';

export enum MintType {
    AIRDROP = 'airdrop',
    BAYC = 'bayc',
    LIQUIDITY = 'liquidity',
    PUBLIC = 'public'
}

export class MintService {
    private contract!: ethers.Contract;
    private wallet!: ethers.Wallet;
    private provider!: ethers.JsonRpcProvider;
    private initialized = false;

    private readonly RPC_ENDPOINTS = [
        'https://bnb-mainnet.g.alchemy.com/v2/SptCeh5drtGyD5VGgFzYY',
        'https://bsc-dataseed1.binance.org',
        'https://bsc-dataseed.bnbchain.org',
        'https://rpc.ankr.com/bsc',
        'https://bsc-dataseed2.binance.org',
    ];

    private readonly ALLOCATIONS = {
        AIRDROP: 50_000,
        BAYC: 50_000,
        LIQUIDITY: 200_000,
        PUBLIC: 700_000,
        TOTAL: 1_000_000
    };

    constructor() {
        // Don't initialize immediately to avoid blocking API routes
        // Initialize lazily when first method is called
    }

    private async initializeProvider() {
        const pk = process.env.PRIVATE_KEY;
        const addr = process.env.MINT_CONTRACT_ADDRESS;

        if (!pk || !addr) {
            throw new Error('Missing PRIVATE_KEY or MINT_CONTRACT_ADDRESS in environment');
        }

        for (const rawUrl of this.RPC_ENDPOINTS) {
            const rpcUrl = rawUrl.trim();
            if (!rpcUrl) continue;

            try {
                this.provider = new ethers.JsonRpcProvider(
                    rpcUrl,
                    { name: 'bsc', chainId: 56 },
                    { staticNetwork: true, batchMaxCount: 1 }
                );

                await this.provider.getBlockNumber();
                this.wallet = new ethers.Wallet(pk, this.provider);

                // Use imported ABI
                this.contract = new ethers.Contract(addr, MyTokenABI.abi, this.wallet);

                console.log(`✅ Connected via: ${this.maskUrl(rpcUrl)}`);
                return;
            } catch (error: any) {
                console.warn(`❌ Failed with ${this.maskUrl(rpcUrl)}: ${error.message}`);
            }
        }
        throw new Error('All RPC endpoints failed');
    }

    private maskUrl(url: string): string {
        return url.replace(/\/v2\/[^/]+$/, '/v2/***');
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initializeProvider();
            this.initialized = true;
        }
    }

    private async retryRpcCall<T>(
        operation: () => Promise<T>,
        maxRetries = 3,
        delayMs = 2000
    ): Promise<T> {
        await this.ensureInitialized();

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error: any) {
                if (attempt === maxRetries) throw error;
                console.warn(`Retry ${attempt}/${maxRetries}: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        throw new Error('Max retries exceeded');
    }

    private async getGasPrice(): Promise<bigint> {
        const feeData = await this.provider.getFeeData();
        if (feeData.gasPrice) return feeData.gasPrice;
        return await this.getGasPrice();
    }

    private validateMintAmount(type: MintType, amount: number) {
        if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        switch (type) {
            case MintType.AIRDROP:
                if (amount > 1000) {
                    throw new Error('Max 1,000 tokens per airdrop');
                }
                break;
            case MintType.BAYC:
                if (amount > 5000) {
                    throw new Error('Max 5,000 tokens per BAYC mint');
                }
                break;
            case MintType.LIQUIDITY:
                if (amount > this.ALLOCATIONS.LIQUIDITY) {
                    throw new Error('Exceeds liquidity allocation');
                }
                break;
            case MintType.PUBLIC:
                if (amount < 1) {
                    throw new Error('Min 1 token for public mint');
                }
                if (amount > 10_000) {
                    throw new Error('Max 10,000 tokens per public mint');
                }
                break;
        }
    }

    async mint(type: MintType, to: string, amountTokens: number): Promise<string> {
        this.validateMintAmount(type, amountTokens);

        let mintFunction: string;
        switch (type) {
            case MintType.AIRDROP:
                mintFunction = 'mintAirdrop';
                break;
            case MintType.BAYC:
                mintFunction = 'mintBayc';
                break;
            case MintType.LIQUIDITY:
                mintFunction = 'mintLiquidity';
                break;
            case MintType.PUBLIC:
                mintFunction = 'mintPublic';
                break;
            default:
                throw new Error('Invalid mint type');
        }

        const amountWei = ethers.parseUnits(amountTokens.toString(), 18);

        console.log(`Minting ${amountTokens} tokens (${type}) to ${to}`);

        const gasEstimate = await this.retryRpcCall(() =>
            this.contract[mintFunction].estimateGas(to, amountWei)
        );

        const gasPrice = await this.getGasPrice();

        const tx = await this.retryRpcCall(() =>
            this.contract[mintFunction](to, amountWei, {
                gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
                gasPrice,
            })
        );

        console.log(`Transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();

        if (receipt.status !== 1) {
            throw new Error('Transaction failed on-chain');
        }

        console.log(`✅ Minted! TxHash: ${receipt.hash}`);
        return receipt.hash;
    }

    async verifyTx(txHash: string): Promise<boolean> {
        try {
            const receipt = await this.retryRpcCall(() =>
                this.provider.getTransactionReceipt(txHash)
            );

            if (!receipt) {
                console.warn('Transaction not found');
                return false;
            }

            return receipt.status === 1;
        } catch (error: any) {
            console.error(`Verify failed: ${error.message}`);
            return false;
        }
    }

    async getDistributionStatus() {
        try {
            const [totalMinted, airdrop, bayc, liquidity, publicProgress] =
                await this.retryRpcCall(() =>
                    this.contract.getDistributionStatus()
                );

            const [airdropRem, baycRem, liquidityRem, publicRem] =
                await this.retryRpcCall(() =>
                    this.contract.getRemainingAllocations()
                );

            return {
                totalMinted: ethers.formatUnits(totalMinted, 18),
                progress: {
                    airdrop: Number(airdrop),
                    bayc: Number(bayc),
                    liquidity: Number(liquidity),
                    public: Number(publicProgress)
                },
                remaining: {
                    airdrop: ethers.formatUnits(airdropRem, 18),
                    bayc: ethers.formatUnits(baycRem, 18),
                    liquidity: ethers.formatUnits(liquidityRem, 18),
                    public: ethers.formatUnits(publicRem, 18)
                }
            };
        } catch (error: any) {
            console.error(`Failed to get distribution status: ${error.message}`);
            throw error;
        }
    }

    async getWalletBalance(): Promise<string> {
        const balance = await this.retryRpcCall(() =>
            this.provider.getBalance(this.wallet.address)
        );
        return ethers.formatEther(balance);
    }

    async disableMinting(): Promise<string> {
        try {
            console.log('Disabling minting permanently...');

            const tx = await this.retryRpcCall(() =>
                this.contract.disableMinting()
            );

            const receipt = await tx.wait();

            if (receipt.status !== 1) {
                throw new Error('Failed to disable minting');
            }

            console.log('✅ Minting disabled permanently');
            return receipt.hash;
        } catch (error: any) {
            console.error(`Failed to disable minting: ${error.message}`);
            throw error;
        }
    }

    async getContractBalance(): Promise<string> {
        const balance = await this.retryRpcCall(() =>
            this.provider.getBalance(this.contract.target)
        );
        return ethers.formatEther(balance);
    }
}