// mint.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { MintService } from './mint.service';

@Controller('mint')
export class MintController {
    constructor(private readonly mintService: MintService) { }

    @Get('health')
    async health() {
        const balance = await this.mintService.getWalletBalance();
        return {
            status: 'ok',
            walletBalance: balance + ' BNB',
        };
    }

    @Post()
    async mint(@Body() body: { txHash: string; to: string; amount: number }) {
        const isValid = await this.mintService.verifyTx(body.txHash);

        if (!isValid) {
            throw new Error('Invalid transaction');
        }

        const mintTxHash = await this.mintService.mintIfAvailable(
            body.to,
            body.amount
        );

        return {
            success: true,
            mintTxHash,
            message: `Minted ${body.amount} tokens`,
        };
    }
}