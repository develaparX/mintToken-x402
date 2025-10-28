import { Controller, Post, Body, HttpException } from '@nestjs/common';
import { isAddress } from 'ethers';
import { MintService } from './mint.service';

@Controller('mint')
export class MintController {
    constructor(private mintService: MintService) { }

    @Post()
    async mint(@Body() body: any) {
        const { txHash, to, amount } = body; // amount = jumlah token (1, 5, 100)

        if (!isAddress(to)) throw new HttpException('Invalid address', 400);
        if (amount < 1 || amount > 100) throw new HttpException('Amount must be 1–100', 400);

        const valid = await this.mintService.verifyTx(txHash);
        if (!valid) throw new HttpException('Invalid transaction', 400);

        try {
            await this.mintService.mintIfAvailable(to, amount);
            return { success: true };
        } catch (err: any) {
            throw new HttpException(err.message, 400);
        }
    }
}