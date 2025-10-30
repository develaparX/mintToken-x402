import { NextRequest, NextResponse } from 'next/server';
import { MintService, MintType } from '@/lib/mint-service';
import { validateMintRequest, validateAmount, createErrorResponse, createSuccessResponse } from '@/lib/validation';

// Lazy initialize mint service
let mintService: MintService | null = null;

function getMintService(): MintService {
    if (!mintService) {
        mintService = new MintService();
    }
    return mintService;
}

export async function POST(request: NextRequest) {
    try {
        const service = getMintService();

        // Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return createErrorResponse('Invalid JSON in request body', 400);
        }

        // Validate basic mint request structure
        const validation = validateMintRequest(body);
        if (!validation.isValid()) {
            return validation.getErrorResponse();
        }

        const { to, amount } = body;

        // Validate liquidity-specific constraints
        if (!validateAmount(amount, 1, 200000)) {
            return createErrorResponse('Amount must be between 1 and 200,000 tokens for liquidity allocation', 400);
        }

        // Check remaining allocation before minting
        const remaining = await service.getRemainingAllocations();
        const remainingLiquidity = parseFloat(remaining.liquidity);

        if (amount > remainingLiquidity) {
            return createErrorResponse(
                `Insufficient liquidity allocation. Requested: ${amount}, Available: ${remainingLiquidity}`,
                400,
                {
                    requested: amount,
                    available: remainingLiquidity,
                    type: 'liquidity'
                }
            );
        }

        // Execute mint transaction
        const txHash = await service.mintLiquidity(to, amount.toString());

        return createSuccessResponse({
            txHash,
            recipient: to,
            amount: amount,
            type: 'liquidity',
            bscscanUrl: `https://bscscan.com/tx/${txHash}`,
            remainingAllocation: remainingLiquidity - amount,
            instructions: {
                note: 'Tokens minted for liquidity pool',
                nextSteps: [
                    'Add these tokens to PancakeSwap liquidity pool',
                    'Pair with BNB or USDT for initial liquidity',
                    'Set appropriate slippage tolerance'
                ]
            }
        }, `Successfully minted ${amount} tokens for liquidity pool`);

    } catch (error: any) {
        console.error('Liquidity mint error:', error);

        // Handle specific error types
        if (error.message.includes('insufficient funds')) {
            return createErrorResponse('Insufficient wallet balance for transaction', 503);
        }

        if (error.message.includes('nonce')) {
            return createErrorResponse('Transaction nonce error, please retry', 503);
        }

        if (error.message.includes('gas')) {
            return createErrorResponse('Gas estimation failed, network may be congested', 503);
        }

        if (error.message.includes('Exceeds liquidity allocation')) {
            return createErrorResponse('Liquidity allocation exceeded', 400);
        }

        return createErrorResponse(
            error.message || 'Liquidity mint failed',
            500,
            { errorType: error.constructor.name }
        );
    }
}