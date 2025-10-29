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

const ALLOCATION_TOTALS = {
    airdrop: 50000,
    bayc: 50000,
    liquidity: 200000,
    public: 700000,
    total: 1000000
};

export async function GET(request: NextRequest) {
    try {
        const service = getMintService();
        const { searchParams } = new URL(request.url);
        const includeWallet = searchParams.get('includeWallet') === 'true';

        const status = await service.getDistributionStatus();

        // Calculate additional metrics
        const totalMinted = parseFloat(status.totalMinted);
        const totalRemaining = Object.values(status.remaining)
            .reduce((sum, val) => sum + parseFloat(val), 0);

        const overallProgress = (totalMinted / ALLOCATION_TOTALS.total) * 100;

        // Build comprehensive status response
        const statusData: any = {
            overview: {
                totalSupply: ALLOCATION_TOTALS.total.toLocaleString(),
                totalMinted: status.totalMinted,
                totalRemaining: totalRemaining.toLocaleString(),
                overallProgress: `${overallProgress.toFixed(2)}%`,
                mintingActive: totalRemaining > 0,
                timestamp: new Date().toISOString(),
            },
            allocations: {
                airdrop: {
                    total: ALLOCATION_TOTALS.airdrop.toLocaleString(),
                    minted: (ALLOCATION_TOTALS.airdrop - parseFloat(status.remaining.airdrop)).toLocaleString(),
                    remaining: status.remaining.airdrop,
                    progress: status.progress.airdrop + '%',
                    isExhausted: parseFloat(status.remaining.airdrop) === 0,
                    description: 'Community airdrop allocation (5% of total supply)',
                },
                bayc: {
                    total: ALLOCATION_TOTALS.bayc.toLocaleString(),
                    minted: (ALLOCATION_TOTALS.bayc - parseFloat(status.remaining.bayc)).toLocaleString(),
                    remaining: status.remaining.bayc,
                    progress: status.progress.bayc + '%',
                    isExhausted: parseFloat(status.remaining.bayc) === 0,
                    description: 'BAYC holder rewards (5% of total supply)',
                },
                liquidity: {
                    total: ALLOCATION_TOTALS.liquidity.toLocaleString(),
                    minted: (ALLOCATION_TOTALS.liquidity - parseFloat(status.remaining.liquidity)).toLocaleString(),
                    remaining: status.remaining.liquidity,
                    progress: status.progress.liquidity + '%',
                    isExhausted: parseFloat(status.remaining.liquidity) === 0,
                    description: 'DEX liquidity pool allocation (20% of total supply)',
                },
                public: {
                    total: ALLOCATION_TOTALS.public.toLocaleString(),
                    minted: (ALLOCATION_TOTALS.public - parseFloat(status.remaining.public)).toLocaleString(),
                    remaining: status.remaining.public,
                    progress: status.progress.public + '%',
                    isExhausted: parseFloat(status.remaining.public) === 0,
                    description: 'Public sale allocation (70% of total supply)',
                },
            },
            metrics: {
                distributionEfficiency: `${((totalMinted / ALLOCATION_TOTALS.total) * 100).toFixed(2)}%`,
                remainingPercentage: `${((totalRemaining / ALLOCATION_TOTALS.total) * 100).toFixed(2)}%`,
                activeAllocations: Object.values(status.remaining)
                    .filter(val => parseFloat(val) > 0).length,
                exhaustedAllocations: Object.values(status.remaining)
                    .filter(val => parseFloat(val) === 0).length,
            }
        };

        // Optionally include wallet information
        if (includeWallet) {
            try {
                const walletBalance = await service.getWalletBalance();
                const contractBalance = await service.getContractBalance();

                statusData.wallet = {
                    balance: walletBalance + ' BNB',
                    contractBalance: contractBalance + ' BNB',
                    canMint: parseFloat(walletBalance) > 0.01, // Minimum BNB for gas
                };
            } catch (walletError) {
                console.warn('Failed to fetch wallet info:', walletError);
                statusData.wallet = {
                    error: 'Unable to fetch wallet information',
                };
            }
        }

        return createSuccessResponse(statusData, 'Distribution status retrieved successfully');

    } catch (error: any) {
        console.error('Status query error:', error);

        // Handle specific error types
        if (error.message.includes('network')) {
            return createErrorResponse('Network error while fetching status', 503);
        }

        if (error.message.includes('contract')) {
            return createErrorResponse('Contract interaction failed', 503);
        }

        if (error.message.includes('RPC')) {
            return createErrorResponse('RPC endpoint error', 503);
        }

        return createErrorResponse(
            error.message || 'Failed to get distribution status',
            500,
            { errorType: error.constructor.name }
        );
    }
}