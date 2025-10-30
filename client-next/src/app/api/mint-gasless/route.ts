import { NextRequest, NextResponse } from 'next/server';
import { B402Facilitator } from '@/lib/b402-facilitator';
import { ethers } from 'ethers';

// Initialize facilitator (in production, use environment variables)
const facilitator = new B402Facilitator(
    process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/',
    process.env.FACILITATOR_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001',
    process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
);

export async function POST(request: NextRequest) {
    try {
        const { userAddress, amount, paymentProof } = await request.json();

        // Validate input
        if (!ethers.isAddress(userAddress)) {
            return NextResponse.json(
                { error: 'Invalid user address' },
                { status: 400 }
            );
        }

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        // Execute gasless mint
        const result = await facilitator.mintTokensGasless(
            userAddress,
            amount,
            paymentProof
        );

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Gasless mint API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}