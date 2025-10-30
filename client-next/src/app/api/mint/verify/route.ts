import { NextRequest, NextResponse } from 'next/server';
import { MintService } from '@/lib/mint-service';
import { validateTxHash, createErrorResponse, createSuccessResponse } from '@/lib/validation';

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

        const { txHash } = body;

        if (!txHash) {
            return createErrorResponse('Transaction hash is required', 400);
        }

        if (!validateTxHash(txHash)) {
            return createErrorResponse(
                'Invalid transaction hash format',
                400,
                {
                    expected: '0x followed by 64 hexadecimal characters',
                    provided: txHash
                }
            );
        }

        // Verify transaction
        const verificationResult = await service.verifyTransaction(txHash);
        const isValid = verificationResult.success;

        const verificationData: any = {
            txHash: txHash,
            isValid,
            status: isValid ? 'confirmed' : 'failed_or_pending',
            statusDescription: isValid
                ? 'Transaction confirmed on blockchain'
                : 'Transaction failed, pending, or not found',
            bscscanUrl: `https://bscscan.com/tx/${txHash}`,
            verifiedAt: new Date().toISOString(),
            network: 'BSC Mainnet',
        };

        // Add additional context based on verification result
        if (isValid) {
            verificationData.message = 'Transaction successfully verified on blockchain';
        } else {
            verificationData.possibleReasons = [
                'Transaction is still pending confirmation',
                'Transaction failed due to insufficient gas',
                'Transaction was reverted by smart contract',
                'Invalid transaction hash provided',
                'Network connectivity issues'
            ];
            verificationData.recommendations = [
                'Wait a few minutes and try again if transaction is pending',
                'Check BSCScan for detailed transaction information',
                'Verify the transaction hash is correct'
            ];
        }

        return createSuccessResponse(
            verificationData,
            `Transaction verification ${isValid ? 'successful' : 'completed'}`
        );

    } catch (error: any) {
        console.error('Transaction verification error:', error);

        // Handle specific error types
        if (error.message.includes('network')) {
            return createErrorResponse(
                'Network error during verification',
                503,
                {
                    suggestion: 'Please check your internet connection and try again',
                    retryable: true
                }
            );
        }

        if (error.message.includes('RPC')) {
            return createErrorResponse(
                'RPC endpoint error during verification',
                503,
                {
                    suggestion: 'Blockchain network may be experiencing issues',
                    retryable: true
                }
            );
        }

        if (error.message.includes('timeout')) {
            return createErrorResponse(
                'Verification request timed out',
                503,
                {
                    suggestion: 'Network may be congested, please try again',
                    retryable: true
                }
            );
        }

        return createErrorResponse(
            error.message || 'Transaction verification failed',
            500,
            {
                errorType: error.constructor.name,
                retryable: true
            }
        );
    }
}