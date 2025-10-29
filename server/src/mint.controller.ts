import {
    Controller,
    Get,
    Post,
    Body,
    HttpException,
    HttpStatus,
    Query
} from '@nestjs/common';
import { MintService, MintType } from './mint.service';

// ============ DTOs ============
class MintPublicDto {
    txHash: string;      // Transaction hash pembayaran USDT
    to: string;          // Recipient wallet address
    amount: number;      // Amount in tokens (not wei)
}

class MintAirdropDto {
    to: string;
    amount: number;
}

class MintBaycDto {
    to: string;
    amount: number;
}

class MintLiquidityDto {
    to: string;
    amount: number;
}

class VerifyTxDto {
    txHash: string;
}

@Controller('mint')
export class MintController {
    constructor(private readonly mintService: MintService) { }

    // ============ Health & Status ============

    /**
     * GET /mint/health
     * Check service health and wallet balance
     */
    @Get('health')
    async health() {
        try {
            const walletBalance = await this.mintService.getWalletBalance();
            const contractBalance = await this.mintService.getContractBalance();

            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                walletBalance: walletBalance + ' BNB',
                contractBalance: contractBalance + ' BNB',
            };
        } catch (error) {
            throw new HttpException(
                {
                    status: 'error',
                    message: error.message,
                },
                HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }

    /**
     * GET /mint/status
     * Get token distribution status
     */
    @Get('status')
    async getStatus() {
        try {
            const status = await this.mintService.getDistributionStatus();

            return {
                success: true,
                data: {
                    totalSupply: '1,000,000',
                    totalMinted: status.totalMinted,
                    allocations: {
                        airdrop: {
                            total: '50,000',
                            remaining: status.remaining.airdrop,
                            progress: status.progress.airdrop + '%',
                        },
                        bayc: {
                            total: '50,000',
                            remaining: status.remaining.bayc,
                            progress: status.progress.bayc + '%',
                        },
                        liquidity: {
                            total: '200,000',
                            remaining: status.remaining.liquidity,
                            progress: status.progress.liquidity + '%',
                        },
                        public: {
                            total: '700,000',
                            remaining: status.remaining.public,
                            progress: status.progress.public + '%',
                        },
                    },
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to get distribution status',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ============ Public Mint (Frontend) ============

    /**
     * POST /mint
     * Main endpoint for public token purchase (70% allocation)
     * Frontend sends payment tx hash, backend verifies and mints
     */
    @Post()
    async mintPublic(@Body() body: MintPublicDto) {
        try {
            // Validate input
            if (!body.txHash || !body.to || !body.amount) {
                throw new HttpException(
                    'Missing required fields: txHash, to, amount',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Validate address format
            if (!body.to.match(/^0x[a-fA-F0-9]{40}$/)) {
                throw new HttpException(
                    'Invalid recipient address',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Validate amount (min 1, max 10,000 per transaction)
            if (body.amount < 1 || body.amount > 10000) {
                throw new HttpException(
                    'Amount must be between 1 and 10,000 tokens',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Step 1: Verify payment transaction
            const isValid = await this.mintService.verifyTx(body.txHash);

            if (!isValid) {
                throw new HttpException(
                    'Invalid or failed payment transaction',
                    HttpStatus.BAD_REQUEST
                );
            }

            // TODO: Additional verification
            // - Verify payment amount matches token amount
            // - Verify payment was sent to correct treasury address
            // - Check if txHash was already used (prevent double-mint)

            // Step 2: Mint tokens to user
            const mintTxHash = await this.mintService.mintPublic(
                body.to,
                body.amount
            );

            return {
                success: true,
                message: `Successfully minted ${body.amount} tokens`,
                data: {
                    mintTxHash,
                    recipient: body.to,
                    amount: body.amount,
                    paymentTxHash: body.txHash,
                    bscscanUrl: `https://bscscan.com/tx/${mintTxHash}`,
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: error.message || 'Mint failed',
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ============ Airdrop Endpoints (Admin) ============

    /**
     * POST /mint/airdrop
     * Mint tokens for airdrop campaign (5% allocation)
     * Protected endpoint - add auth guard in production
     */
    @Post('airdrop')
    async mintAirdrop(@Body() body: MintAirdropDto) {
        try {
            // TODO: Add authentication/authorization here
            // @UseGuards(AdminGuard)

            if (!body.to || !body.amount) {
                throw new HttpException(
                    'Missing required fields: to, amount',
                    HttpStatus.BAD_REQUEST
                );
            }

            if (body.amount <= 0 || body.amount > 1000) {
                throw new HttpException(
                    'Amount must be between 1 and 1,000 tokens',
                    HttpStatus.BAD_REQUEST
                );
            }

            const txHash = await this.mintService.mintAirdrop(
                body.to,
                body.amount
            );

            return {
                success: true,
                message: `Airdrop: ${body.amount} tokens sent`,
                data: {
                    txHash,
                    recipient: body.to,
                    amount: body.amount,
                    type: 'airdrop',
                    bscscanUrl: `https://bscscan.com/tx/${txHash}`,
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: error.message || 'Airdrop mint failed',
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * POST /mint/airdrop/batch
     * Batch airdrop to multiple addresses
     */
    @Post('airdrop/batch')
    async mintAirdropBatch(
        @Body() body: { recipients: Array<{ to: string; amount: number }> }
    ) {
        try {
            // TODO: Add authentication

            if (!body.recipients || !Array.isArray(body.recipients)) {
                throw new HttpException(
                    'Invalid recipients array',
                    HttpStatus.BAD_REQUEST
                );
            }

            const results: Array<{
                success: boolean;
                to: string;
                amount: number;
                txHash: string;
            }> = [];

            const errors: Array<{
                to: string;
                amount: number;
                error: string;
            }> = [];

            for (const recipient of body.recipients) {
                try {
                    const txHash = await this.mintService.mintAirdrop(
                        recipient.to,
                        recipient.amount
                    );

                    results.push({
                        success: true,
                        to: recipient.to,
                        amount: recipient.amount,
                        txHash,
                    });

                    // Add delay to avoid nonce issues
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (err) {
                    errors.push({
                        to: recipient.to,
                        amount: recipient.amount,
                        error: err.message,
                    });
                }
            }

            return {
                success: true,
                message: `Batch airdrop completed: ${results.length} success, ${errors.length} failed`,
                data: {
                    successful: results,
                    failed: errors,
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: error.message || 'Batch airdrop failed',
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ============ BAYC Community Endpoints (Admin) ============

    /**
     * POST /mint/bayc
     * Mint tokens for BAYC holders (5% allocation)
     */
    @Post('bayc')
    async mintBayc(@Body() body: MintBaycDto) {
        try {
            // TODO: Add authentication
            // TODO: Verify BAYC ownership if needed

            if (!body.to || !body.amount) {
                throw new HttpException(
                    'Missing required fields: to, amount',
                    HttpStatus.BAD_REQUEST
                );
            }

            if (body.amount <= 0 || body.amount > 5000) {
                throw new HttpException(
                    'Amount must be between 1 and 5,000 tokens',
                    HttpStatus.BAD_REQUEST
                );
            }

            const txHash = await this.mintService.mintBayc(body.to, body.amount);

            return {
                success: true,
                message: `BAYC reward: ${body.amount} tokens sent`,
                data: {
                    txHash,
                    recipient: body.to,
                    amount: body.amount,
                    type: 'bayc',
                    bscscanUrl: `https://bscscan.com/tx/${txHash}`,
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: error.message || 'BAYC mint failed',
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ============ Liquidity Endpoints (Admin) ============

    /**
     * POST /mint/liquidity
     * Mint tokens for liquidity pool (20% allocation)
     */
    @Post('liquidity')
    async mintLiquidity(@Body() body: MintLiquidityDto) {
        try {
            // TODO: Add authentication
            // This is critical - only owner should be able to mint for liquidity

            if (!body.to || !body.amount) {
                throw new HttpException(
                    'Missing required fields: to, amount',
                    HttpStatus.BAD_REQUEST
                );
            }

            if (body.amount <= 0 || body.amount > 200000) {
                throw new HttpException(
                    'Amount must be between 1 and 200,000 tokens',
                    HttpStatus.BAD_REQUEST
                );
            }

            const txHash = await this.mintService.mintLiquidity(
                body.to,
                body.amount
            );

            return {
                success: true,
                message: `Liquidity mint: ${body.amount} tokens`,
                data: {
                    txHash,
                    recipient: body.to,
                    amount: body.amount,
                    type: 'liquidity',
                    bscscanUrl: `https://bscscan.com/tx/${txHash}`,
                    note: 'Add these tokens to PancakeSwap liquidity pool',
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: error.message || 'Liquidity mint failed',
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ============ Utility Endpoints ============

    /**
     * POST /mint/verify
     * Verify if a transaction was successful
     */
    @Post('verify')
    async verifyTransaction(@Body() body: VerifyTxDto) {
        try {
            if (!body.txHash) {
                throw new HttpException(
                    'Transaction hash required',
                    HttpStatus.BAD_REQUEST
                );
            }

            const isValid = await this.mintService.verifyTx(body.txHash);

            return {
                success: true,
                data: {
                    txHash: body.txHash,
                    isValid,
                    status: isValid ? 'confirmed' : 'failed or pending',
                    bscscanUrl: `https://bscscan.com/tx/${body.txHash}`,
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Verification failed',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * GET /mint/allocation
     * Get remaining allocation for specific type
     */
    @Get('allocation')
    async getAllocation(@Query('type') type?: string) {
        try {
            const status = await this.mintService.getDistributionStatus();

            if (type) {
                const validTypes = ['airdrop', 'bayc', 'liquidity', 'public'];
                if (!validTypes.includes(type)) {
                    throw new HttpException(
                        'Invalid type. Must be: airdrop, bayc, liquidity, or public',
                        HttpStatus.BAD_REQUEST
                    );
                }

                return {
                    success: true,
                    data: {
                        type,
                        remaining: status.remaining[type],
                        progress: status.progress[type] + '%',
                    },
                };
            }

            return {
                success: true,
                data: status.remaining,
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to get allocation',
                    error: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * POST /mint/disable
     * Permanently disable minting (DANGEROUS - one-way operation)
     * Use only after all distributions are complete
     */
    @Post('disable')
    async disableMinting() {
        try {
            // TODO: Add STRONG authentication here
            // This should require multi-sig or special admin privileges

            const txHash = await this.mintService.disableMinting();

            return {
                success: true,
                message: '⚠️ MINTING PERMANENTLY DISABLED',
                data: {
                    txHash,
                    warning: 'This action cannot be reversed',
                    bscscanUrl: `https://bscscan.com/tx/${txHash}`,
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to disable minting',
                    error: error.message,
                },
                error.status || HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}