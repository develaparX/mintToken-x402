import { NextRequest, NextResponse } from 'next/server';
import { MintService, MintType } from '@/lib/mint-service';
import { validateBatchRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

// Lazy initialize mint service
let mintService: MintService | null = null;

function getMintService(): MintService {
    if (!mintService) {
        mintService = new MintService();
    }
    return mintService;
}

interface BatchRecipient {
    to: string;
    amount: number;
}

interface BatchResult {
    success: boolean;
    to: string;
    amount: number;
    txHash?: string;
    bscscanUrl?: string;
    error?: string;
    timestamp: string;
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

        // Validate batch request structure
        const validation = validateBatchRequest(body);
        if (!validation.isValid()) {
            return validation.getErrorResponse();
        }

        const { recipients } = body;

        // Check total amount against remaining allocation
        const totalAmount = recipients.reduce((sum: number, r: BatchRecipient) => sum + r.amount, 0);
        const remaining = await service.getRemainingAllocations();
        const remainingAirdrop = parseFloat(remaining.airdrop);

        if (totalAmount > remainingAirdrop) {
            return createErrorResponse(
                `Insufficient airdrop allocation for batch. Total requested: ${totalAmount}, Available: ${remainingAirdrop}`,
                400,
                {
                    totalRequested: totalAmount,
                    available: remainingAirdrop,
                    recipients: recipients.length
                }
            );
        }

        // Process batch with improved error handling
        const results: BatchResult[] = [];
        let processedAmount = 0;

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const timestamp = new Date().toISOString();

            try {
                console.log(`Processing batch item ${i + 1}/${recipients.length}: ${recipient.amount} tokens to ${recipient.to}`);

                const txHash = await service.mintAirdrop(recipient.to, recipient.amount.toString());
                processedAmount += recipient.amount;

                results.push({
                    success: true,
                    to: recipient.to,
                    amount: recipient.amount,
                    txHash,
                    bscscanUrl: `https://bscscan.com/tx/${txHash}`,
                    timestamp,
                });

                // Progressive delay to avoid nonce conflicts
                const delay = Math.min(2000 + (i * 500), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));

            } catch (err: any) {
                console.error(`Batch item ${i + 1} failed:`, err.message);

                results.push({
                    success: false,
                    to: recipient.to,
                    amount: recipient.amount,
                    error: err.message,
                    timestamp,
                });

                // Continue processing other recipients even if one fails
                // Add shorter delay for failed transactions
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        const responseData = {
            summary: {
                total: recipients.length,
                successful: successful.length,
                failed: failed.length,
                totalTokensDistributed: processedAmount,
                remainingAllocation: remainingAirdrop - processedAmount,
            },
            results: {
                successful: successful,
                failed: failed,
            },
            batchId: `batch_${Date.now()}`,
        };

        // Return success even if some items failed (partial success)
        const message = failed.length === 0
            ? `Batch airdrop completed successfully: ${successful.length} recipients`
            : `Batch airdrop completed with ${successful.length} successful and ${failed.length} failed transactions`;

        return createSuccessResponse(responseData, message);

    } catch (error: any) {
        console.error('Batch airdrop error:', error);

        // Handle specific error types
        if (error.message.includes('insufficient funds')) {
            return createErrorResponse('Insufficient wallet balance for batch transaction', 503);
        }

        if (error.message.includes('network')) {
            return createErrorResponse('Network error during batch processing', 503);
        }

        return createErrorResponse(
            error.message || 'Batch airdrop failed',
            500,
            { errorType: error.constructor.name }
        );
    }
}