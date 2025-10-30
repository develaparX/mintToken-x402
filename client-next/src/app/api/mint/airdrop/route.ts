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

        // Validate airdrop-specific constraints
        if (!validateAmount(amount, 1, 1000)) {
            return createErrorResponse('Amount must be between 1 and 1,000 tokens for airdrop', 400);
        }

        // Check remaining allocation before minting
        const remaining = await service.getRemainingAllocations();
        const remainingAirdrop = parseFloat(remaining.airdrop);

        if (amount > remainingAirdrop) {
            return createErrorResponse(
                `Insufficient airdrop allocation. Requested: ${amount}, Available: ${remainingAirdrop}`,
                400,
                {
                    requested: amount,
                    available: remainingAirdrop,
                    type: 'airdrop'
                }
            );
        }

        // Execute mint transaction
        const txHash = await service.mintAirdrop(to, amount.toString());

        return createSuccessResponse({
            txHash,
            recipient: to,
            amount: amount,
            type: 'airdrop',
            bscscanUrl: `https://bscscan.com/tx/${txHash}`,
            remainingAllocation: remainingAirdrop - amount,
        }, `Successfully airdropped ${amount} tokens to ${to}`);

    } catch (error: any) {
        console.error('Airdrop mint error:', error);

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

        return createErrorResponse(
            error.message || 'Airdrop mint failed',
            500,
            { errorType: error.constructor.name }
        );
    }
}