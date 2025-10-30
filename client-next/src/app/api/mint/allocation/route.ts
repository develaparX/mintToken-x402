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
        const type = searchParams.get('type');
        const format = searchParams.get('format') || 'detailed'; // 'detailed' or 'simple'

        const [distributionStatus, remainingAllocations] = await Promise.all([
            service.getDistributionStatus(),
            service.getRemainingAllocations()
        ]);

        // If specific type requested
        if (type) {
            const validTypes = ['airdrop', 'bayc', 'liquidity', 'public'];
            if (!validTypes.includes(type)) {
                return createErrorResponse(
                    `Invalid allocation type: ${type}`,
                    400,
                    {
                        validTypes,
                        provided: type
                    }
                );
            }

            const typeKey = type as keyof typeof remainingAllocations;
            const remaining = parseFloat(remainingAllocations[typeKey]);
            const total = ALLOCATION_TOTALS[typeKey];
            const minted = total - remaining;
            const progress = Math.round((minted / total) * 100);

            const allocationData = {
                type,
                total: total.toLocaleString(),
                minted: minted.toLocaleString(),
                remaining: remaining.toLocaleString(),
                progress: `${progress}%`,
                percentageRemaining: `${((remaining / total) * 100).toFixed(2)}%`,
                isExhausted: remaining === 0,
                canMint: remaining > 0,
            };

            if (format === 'simple') {
                return createSuccessResponse({
                    remaining: remaining.toLocaleString(),
                    progress: `${progress}%`,
                });
            }

            return createSuccessResponse(allocationData);
        }

        // Return all allocations
        const totalRemaining = Object.values(remainingAllocations)
            .reduce((sum, val) => sum + parseFloat(val), 0);

        const allAllocations = {
            summary: {
                totalSupply: ALLOCATION_TOTALS.total.toLocaleString(),
                totalMinted: distributionStatus.totalMinted,
                totalRemaining: totalRemaining.toLocaleString(),
                overallProgress: `${(
                    (parseFloat(distributionStatus.totalMinted) / ALLOCATION_TOTALS.total) * 100
                ).toFixed(2)}%`,
            },
            allocations: {} as any
        };

        // Build detailed allocation info for each type
        for (const [allocType, total] of Object.entries(ALLOCATION_TOTALS)) {
            if (allocType === 'total') continue;

            const typeKey = allocType as keyof typeof remainingAllocations;
            const remaining = parseFloat(remainingAllocations[typeKey]);
            const minted = total - remaining;
            const progress = Math.round((minted / total) * 100);

            allAllocations.allocations[allocType] = {
                total: total.toLocaleString(),
                minted: minted.toLocaleString(),
                remaining: remaining.toLocaleString(),
                progress: `${progress}%`,
                percentageRemaining: `${((remaining / total) * 100).toFixed(2)}%`,
                isExhausted: remaining === 0,
                canMint: remaining > 0,
            };
        }

        if (format === 'simple') {
            return createSuccessResponse({
                remaining: remainingAllocations,
                totalMinted: distributionStatus.totalMinted,
            });
        }

        return createSuccessResponse(allAllocations);

    } catch (error: any) {
        console.error('Allocation query error:', error);

        // Handle specific error types
        if (error.message.includes('network')) {
            return createErrorResponse('Network error while fetching allocation data', 503);
        }

        if (error.message.includes('contract')) {
            return createErrorResponse('Contract interaction failed', 503);
        }

        return createErrorResponse(
            error.message || 'Failed to get allocation data',
            500,
            { errorType: error.constructor.name }
        );
    }
}