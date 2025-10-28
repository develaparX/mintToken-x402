import { Injectable } from '@nestjs/common';
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

    constructor() {
        const pk = process.env.PRIVATE_KEY;
        const addr = process.env.MINT_CONTRACT_ADDRESS;
        if (!pk || !addr) throw new Error('Missing env vars');

        this.provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
        this.wallet = new ethers.Wallet(pk, this.provider);

        const abi = JSON.parse(fs.readFileSync(path.join(__dirname, 'MyToken.json'), 'utf8')).abi;
        this.contract = new ethers.Contract(addr, abi, this.wallet);
    }

    async verifyTx(txHash: string): Promise<boolean> {
        const receipt = await this.provider.getTransactionReceipt(txHash);
        return receipt?.status === 1;
    }

    async mintIfAvailable(to: string, amountTokens: number): Promise<void> {
        const amountWei = ethers.parseUnits(amountTokens.toString(), 18); // 1 token = 1e18
        const currentSupply = await this.contract.totalSupply();
        const maxSupply = 10000n * 10n ** 18n;

        if (currentSupply + amountWei > maxSupply) {
            throw new Error('Sold out');
        }

        const tx = await this.contract.mint(to, amountWei);
        await tx.wait();
    }
}