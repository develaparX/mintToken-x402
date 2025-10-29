import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class MintService {
    private contract: ethers.Contract;
    private wallet: ethers.Wallet;
    private provider: ethers.JsonRpcProvider;
    private readonly logger = new Logger(MintService.name);

    // ✅ Daftar RPC dengan priority (Alchemy first, then free RPCs)
    private readonly RPC_ENDPOINTS = [
        'https://bnb-mainnet.g.alchemy.com/v2/SptCeh5drtGyD5VGgFzYY', // Alchemy (fastest)
        'https://bsc-dataseed1.binance.org',
        'https://bsc-dataseed.bnbchain.org',
        'https://rpc.ankr.com/bsc',
        'https://bsc-dataseed2.binance.org',
        'https://bsc-dataseed3.binance.org',
    ];

    constructor() {
        this.initializeProvider();
    }

    /**
     * Try connecting to RPCs in order until one succeeds
     */
    private async initializeProvider() {
        const pk = process.env.PRIVATE_KEY;
        const addr = process.env.MINT_CONTRACT_ADDRESS;

        if (!pk || !addr) {
            throw new Error('Missing PRIVATE_KEY or MINT_CONTRACT_ADDRESS in .env');
        }

        for (const rpcUrl of this.RPC_ENDPOINTS) {
            try {
                this.logger.log(`Attempting to connect to: ${this.maskUrl(rpcUrl)}`);

                // Create provider with timeout settings
                this.provider = new ethers.JsonRpcProvider(
                    rpcUrl,
                    {
                        name: 'bsc',
                        chainId: 56,
                    },
                    {
                        staticNetwork: true, // Skip network detection
                        batchMaxCount: 1,
                    }
                );

                // Test connection with timeout
                const blockNumber = await Promise.race([
                    this.provider.getBlockNumber(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Connection timeout')), 5000)
                    )
                ]) as number;

                this.logger.log(`✅ Connected! Current block: ${blockNumber}`);

                // Initialize wallet and contract
                this.wallet = new ethers.Wallet(pk, this.provider);

                const abi = JSON.parse(
                    fs.readFileSync(path.join(__dirname, 'MyToken.json'), 'utf8')
                ).abi;

                this.contract = new ethers.Contract(addr, abi, this.wallet);

                this.logger.log(`✅ Contract loaded at ${addr}`);
                this.logger.log(`✅ Wallet address: ${this.wallet.address}`);

                return; // Success! Exit loop

            } catch (error) {
                this.logger.warn(
                    `❌ Failed to connect to ${this.maskUrl(rpcUrl)}: ${error.message}`
                );
                continue; // Try next RPC
            }
        }

        throw new Error('❌ All RPC endpoints failed. Check your network connection.');
    }

    /**
     * Mask sensitive parts of URL for logging
     */
    private maskUrl(url: string): string {
        return url.replace(/\/v2\/[^/]+$/, '/v2/***');
    }

    /**
     * Retry logic for RPC calls
     */
    private async retryRpcCall<T>(
        operation: () => Promise<T>,
        maxRetries = 3,
        delayMs = 2000
    ): Promise<T> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === maxRetries) throw error;

                this.logger.warn(
                    `Retry ${attempt}/${maxRetries} after ${delayMs}ms: ${error.message}`
                );

                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        throw new Error('Max retries exceeded');
    }

    /**
     * Verify transaction on BSC
     */
    async verifyTx(txHash: string): Promise<boolean> {
        try {
            this.logger.log(`Verifying tx: ${txHash}`);

            const receipt = await this.retryRpcCall(() =>
                this.provider.getTransactionReceipt(txHash)
            );

            if (!receipt) {
                this.logger.warn('Transaction not found or pending');
                return false;
            }

            const success = receipt.status === 1;
            this.logger.log(`Transaction ${success ? '✅ SUCCESS' : '❌ FAILED'}`);

            return success;

        } catch (error) {
            this.logger.error(`Failed to verify tx: ${error.message}`);
            return false;
        }
    }

    /**
     * Mint tokens if supply available
     */
    async mintIfAvailable(to: string, amountTokens: number): Promise<string> {
        try {
            const amountWei = ethers.parseUnits(amountTokens.toString(), 18);

            // ✅ Step 1: Check supply with retry
            this.logger.log('Checking current supply...');
            const currentSupply = await this.retryRpcCall(() =>
                this.contract.totalSupply()
            );

            const maxSupply = 10000n * 10n ** 18n;
            this.logger.log(
                `Supply: ${ethers.formatUnits(currentSupply, 18)} / 10000 tokens`
            );

            if (currentSupply + amountWei > maxSupply) {
                throw new Error('❌ Sold out! Max supply reached.');
            }

            // ✅ Step 2: Estimate gas
            this.logger.log('Estimating gas...');
            const gasEstimate = await this.retryRpcCall(() =>
                this.contract.mint.estimateGas(to, amountWei)
            );

            // ✅ Step 3: Send mint transaction
            this.logger.log(`Minting ${amountTokens} tokens to ${to}...`);
            const tx = await this.retryRpcCall(() =>
                this.contract.mint(to, amountWei, {
                    gasLimit: gasEstimate * 120n / 100n, // +20% buffer
                })
            );

            this.logger.log(`Transaction sent: ${tx.hash}`);

            // ✅ Step 4: Wait for confirmation
            this.logger.log('Waiting for confirmation...');
            const receipt = await tx.wait();

            if (receipt.status !== 1) {
                throw new Error('Transaction failed on-chain');
            }

            this.logger.log(`✅ Minted successfully! TxHash: ${receipt.hash}`);
            return receipt.hash;

        } catch (error) {
            this.logger.error(`Mint failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get current contract balance
     */
    async getContractBalance(): Promise<string> {
        const balance = await this.retryRpcCall(() =>
            this.provider.getBalance(this.contract.target)
        );
        return ethers.formatEther(balance);
    }

    /**
     * Get wallet balance
     */
    async getWalletBalance(): Promise<string> {
        if (!this.provider || !this.wallet) {
            throw new Error('Provider or wallet not initialized');
        }

        const balance = await this.retryRpcCall(() =>
            this.provider.getBalance(this.wallet.address)
        );
        return ethers.formatEther(balance);
    }
}