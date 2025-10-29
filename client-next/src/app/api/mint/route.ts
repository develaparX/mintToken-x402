import { NextRequest, NextResponse } from 'next/server';
import { MintService, MintType } from '@/lib/mint-service';
import { validateMintRequest, validateTxHash, validateAmount, createErrorResponse, createSuccessResponse } from '@/lib/validation';

// Lazy initialize mint service
let mintService: MintService | null = null;

function getMintService(): MintService {
    if (!mintService) {
        mintService = new MintService();
    }
    return mintService;
}

// In-memory store for used transaction hashes (in production, use Redis or database)
const usedTxHashes = new Set<string>();

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

        const { txHash, to, amount } = body;

        // Validate required fields
        if (!txHash) {
            return createErrorResponse('Payment transaction hash is required', 400);
        }

        // Validate basic mint request structure
        const validation = validateMintRequest(body);
        if (!validation.isValid()) {
            return validation.getErrorResponse();
        }

        // Validate transaction hash format
        if (!validateTxHash(txHash)) {
            return createErrorResponse(
                'Invalid payment transaction hash format',
                400,
                {
                    expected: '0x followed by 64 hexadecimal characters',
                    provided: txHash
                }
            );
        }

        // Validate public mint amount constraints
        if (!validateAmount(amount, 1, 10000)) {
            return createErrorResponse('Amount must be between 1 and 10,000 tokens for public mint', 400);
        }

        // Check if transaction hash was already used (prevent double-minting)
        if (usedTxHashes.has(txHash)) {
            return createErrorResponse(
                'Payment transaction has already been used for minting',
                400,
                {
                    txHash,
                    reason: 'double_mint_prevention',
                    suggestion: 'Each payment transaction can only be used once for minting'
                }
            );
        }

        // Check remaining public allocation before processing
        const status = await service.getDistributionStatus();
        const remainingPublic = parseFloat(status.remaining.public);

        if (amount > remainingPublic) {
            return createErrorResponse(
                `Insufficient public allocation. Requested: ${amount}, Available: ${remainingPublic}`,
                400,
                {
                    requested: amount,
                    available: remainingPublic,
                    type: 'public',
                    suggestion: remainingPublic > 0 ? `Maximum available: ${remainingPublic} tokens` : 'Public sale is sold out'
                }
            );
        }

        // Step 1: Verify payment transaction
        console.log(`Verifying payment transaction: ${txHash}`);
        const isValid = await service.verifyTx(txHash);

        if (!isValid) {
            return createErrorResponse(
                'Payment transaction verification failed',
                400,
                {
                    txHash,
                    bscscanUrl: `https://bscscan.com/tx/${txHash}`,
                    possibleReasons: [
                        'Transaction is still pending confirmation',
                        'Transaction failed or was reverted',
                        'Invalid transaction hash provided',
                        'Network connectivity issues'
                    ],
                    suggestions: [
                        'Wait for transaction confirmation and try again',
                        'Check transaction status on BSCScan',
                        'Verify the transaction hash is correct'
                    ]
                }
            );
        }

        // Step 2: Mark transaction hash as used (before minting to prevent race conditions)
        usedTxHashes.add(txHash);

        try {
            // Step 3: Mint tokens to user
            console.log(`Minting ${amount} tokens to ${to} for payment ${txHash}`);
            const mintTxHash = await service.mint(MintType.PUBLIC, to, amount);

            return createSuccessResponse({
                mintTxHash,
                recipient: to,
                amount: amount,
                type: 'public',
                paymentTxHash: txHash,
                bscscanUrl: `https://bscscan.com/tx/${mintTxHash}`,
                paymentBscscanUrl: `https://bscscan.com/tx/${txHash}`,
                remainingAllocation: remainingPublic - amount,
                mintedAt: new Date().toISOString(),
            }, `Successfully minted ${amount} tokens to ${to}`);

        } catch (mintError: any) {
            // If minting fails, remove the transaction hash from used set
            usedTxHashes.delete(txHash);
            throw mintError;
        }

    } catch (error: any) {
        console.error('Public mint error:', error);

        // Handle specific error types
        if (error.message.includes('insufficient funds')) {
            return createErrorResponse(
                'Insufficient wallet balance for minting transaction',
                503,
                {
                    suggestion: 'Please contact support to resolve wallet funding issues',
                    retryable: false
                }
            );
        }

        if (error.message.includes('nonce')) {
            return createErrorResponse(
                'Transaction nonce error, please retry',
                503,
                {
                    suggestion: 'This is usually temporary, please try again in a few seconds',
                    retryable: true
                }
            );
        }

        if (error.message.includes('gas')) {
            return createErrorResponse(
                'Gas estimation failed, network may be congested',
                503,
                {
                    suggestion: 'Network congestion detected, please try again in a few minutes',
                    retryable: true
                }
            );
        }

        if (error.message.includes('revert')) {
            return createErrorResponse(
                'Smart contract rejected the transaction',
                400,
                {
                    suggestion: 'This may indicate insufficient allocation or contract restrictions',
                    retryable: false
                }
            );
        }

        return createErrorResponse(
            error.message || 'Public mint failed',
            500,
            {
                errorType: error.constructor.name,
                retryable: true
            }
        );
    }
}