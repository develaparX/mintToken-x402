import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// MyToken Contract ABI
const MYTOKEN_ABI = [
    "function addPaymentToken(address token, uint8 decimals) external",
    "function isPaymentTokenAccepted(address token) external view returns (bool)",
    "function owner() external view returns (address)"
];

export async function POST(request: NextRequest) {
    try {
        const { tokenAddress, tokenSymbol, decimals } = await request.json();

        // Validate input
        if (!tokenAddress || !tokenSymbol || decimals === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: tokenAddress, tokenSymbol, decimals' },
                { status: 400 }
            );
        }

        if (!ethers.isAddress(tokenAddress)) {
            return NextResponse.json(
                { error: 'Invalid token address' },
                { status: 400 }
            );
        }

        // Get contract addresses
        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!contractAddress) {
            return NextResponse.json(
                { error: 'Contract address not configured' },
                { status: 500 }
            );
        }

        // Initialize provider and owner wallet
        const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
        const ownerWallet = new ethers.Wallet(process.env.FACILITATOR_PRIVATE_KEY!, provider);

        // Create contract instance
        const myTokenContract = new ethers.Contract(contractAddress, MYTOKEN_ABI, ownerWallet);

        // Verify we are the owner
        const contractOwner = await myTokenContract.owner();
        if (contractOwner.toLowerCase() !== ownerWallet.address.toLowerCase()) {
            return NextResponse.json(
                { error: 'Only contract owner can add payment tokens' },
                { status: 403 }
            );
        }

        // Check if token is already accepted
        const isAlreadyAccepted = await myTokenContract.isPaymentTokenAccepted(tokenAddress);
        if (isAlreadyAccepted) {
            return NextResponse.json({
                success: true,
                message: `${tokenSymbol} is already accepted as payment token`,
                data: {
                    tokenAddress,
                    tokenSymbol,
                    decimals,
                    alreadyAccepted: true
                }
            });
        }

        console.log(`Adding payment token: ${tokenSymbol} (${tokenAddress}) with ${decimals} decimals`);

        // Add payment token to contract
        const tx = await myTokenContract.addPaymentToken(tokenAddress, decimals);
        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Verify token was added successfully
        const isNowAccepted = await myTokenContract.isPaymentTokenAccepted(tokenAddress);
        if (!isNowAccepted) {
            throw new Error('Token addition failed - not accepted after transaction');
        }

        return NextResponse.json({
            success: true,
            message: `${tokenSymbol} successfully added as payment token`,
            data: {
                tokenAddress,
                tokenSymbol,
                decimals,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                bscscanUrl: `https://bscscan.com/tx/${tx.hash}`
            }
        });

    } catch (error: any) {
        console.error('Add payment token error:', error);

        // Handle specific errors
        if (error.code === 'INSUFFICIENT_FUNDS') {
            return NextResponse.json(
                { error: 'Insufficient BNB for gas fees' },
                { status: 500 }
            );
        }

        if (error.reason) {
            return NextResponse.json(
                { error: `Transaction failed: ${error.reason}` },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to add payment token' },
            { status: 500 }
        );
    }
}

// GET method to check if token is accepted
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tokenAddress = searchParams.get('tokenAddress');

        if (!tokenAddress) {
            return NextResponse.json(
                { error: 'Missing tokenAddress parameter' },
                { status: 400 }
            );
        }

        if (!ethers.isAddress(tokenAddress)) {
            return NextResponse.json(
                { error: 'Invalid token address' },
                { status: 400 }
            );
        }

        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!contractAddress) {
            return NextResponse.json(
                { error: 'Contract address not configured' },
                { status: 500 }
            );
        }

        // Initialize provider
        const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
        const myTokenContract = new ethers.Contract(contractAddress, MYTOKEN_ABI, provider);

        // Check if token is accepted
        const isAccepted = await myTokenContract.isPaymentTokenAccepted(tokenAddress);

        return NextResponse.json({
            success: true,
            data: {
                tokenAddress,
                isAccepted
            }
        });

    } catch (error: any) {
        console.error('Check payment token error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check payment token' },
            { status: 500 }
        );
    }
}