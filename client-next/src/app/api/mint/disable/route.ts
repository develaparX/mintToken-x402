import { NextRequest, NextResponse } from 'next/server';
import { MintService } from '@/lib/mint-service';
import { createErrorResponse, createSuccessResponse } from '@/lib/validation';

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

        // Parse and validate request body for confirmation
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return createErrorResponse('Invalid JSON in request body', 400);
        }

        // Require explicit confirmation to prevent accidental calls
        if (!body.confirmation || body.confirmation !== 'PERMANENTLY_DISABLE_MINTING') {
            return createErrorResponse(
                'Missing or invalid confirmation. Required: "PERMANENTLY_DISABLE_MINTING"',
                400,
                {
                    required: 'PERMANENTLY_DISABLE_MINTING',
                    warning: 'This action cannot be reversed'
                }
            );
        }

        // Optional reason for audit trail
        const reason = body.reason || 'No reason provided';

        // Get current status before disabling
        const [statusBefore, remainingAllocations] = await Promise.all([
            service.getDistributionStatus(),
            service.getRemainingAllocations()
        ]);

        // Execute disable transaction
        const txHash = await service.disableMinting();

        return createSuccessResponse({
            txHash,
            bscscanUrl: `https://bscscan.com/tx/${txHash}`,
            timestamp: new Date().toISOString(),
            reason: reason,
            statusBeforeDisable: {
                totalMinted: statusBefore.totalMinted,
                remainingAllocations: remainingAllocations
            },
            warnings: [
                'Minting has been permanently disabled',
                'This action cannot be reversed',
                'No more tokens can be minted from any allocation',
                'All future mint attempts will fail'
            ]
        }, '⚠️ MINTING PERMANENTLY DISABLED');

    } catch (error: any) {
        console.error('Disable minting error:', error);

        // Handle specific error types
        if (error.message.includes('already disabled')) {
            return createErrorResponse('Minting is already disabled', 400);
        }

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
            error.message || 'Failed to disable minting',
            500,
            { errorType: error.constructor.name }
        );
    }
}