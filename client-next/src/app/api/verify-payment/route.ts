import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// USDT Contract ABI for balance checking
const USDT_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Token addresses on BSC
const TOKEN_ADDRESSES = {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    USD1: "0x55d398326f99059fF775485246999027B3197955"
};

export async function POST(request: NextRequest) {
    try {
        const {
            userAddress,
            facilitatorAddress,
            tokenSymbol,
            expectedAmount,
            timeWindow = 300 // 5 minutes default
        } = await request.json();

        // Validate input
        if (!userAddress || !facilitatorAddress || !tokenSymbol || !expectedAmount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!ethers.isAddress(userAddress) || !ethers.isAddress(facilitatorAddress)) {
            return NextResponse.json(
                { error: 'Invalid address format' },
                { status: 400 }
            );
        }

        // Get token contract address
        const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
        if (!tokenAddress) {
            return NextResponse.json(
                { error: 'Unsupported token' },
                { status: 400 }
            );
        }

        // Initialize provider
        const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
        const tokenContract = new ethers.Contract(tokenAddress, USDT_ABI, provider);

        // Get token decimals
        const decimals = await tokenContract.decimals();
        const expectedAmountWei = ethers.parseUnits(expectedAmount.toString(), decimals);

        // Get current block number
        const currentBlock = await provider.getBlockNumber();

        // Calculate blocks to search (BSC ~3 seconds per block)
        const blocksToSearch = Math.ceil(timeWindow / 3);
        const fromBlock = Math.max(currentBlock - blocksToSearch, 0);

        console.log(`Searching for payment from block ${fromBlock} to ${currentBlock}`);

        // Search for Transfer events from user to facilitator
        const filter = tokenContract.filters.Transfer(userAddress, facilitatorAddress);
        const events = await tokenContract.queryFilter(filter, fromBlock, currentBlock);

        console.log(`Found ${events.length} transfer events`);

        // Check if any recent transfer matches expected amount
        let paymentFound = false;
        let matchingEvent = null;

        for (const event of events) {
            const transferAmount = event.args?.[2];
            if (transferAmount && transferAmount >= expectedAmountWei) {
                paymentFound = true;
                matchingEvent = {
                    txHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                    amount: ethers.formatUnits(transferAmount, decimals),
                    from: event.args?.[0],
                    to: event.args?.[1]
                };
                break;
            }
        }

        if (paymentFound && matchingEvent) {
            return NextResponse.json({
                success: true,
                paymentVerified: true,
                message: 'Payment verified successfully',
                data: {
                    txHash: matchingEvent.txHash,
                    blockNumber: matchingEvent.blockNumber,
                    amount: matchingEvent.amount,
                    tokenSymbol,
                    from: matchingEvent.from,
                    to: matchingEvent.to,
                    expectedAmount: expectedAmount.toString()
                }
            });
        } else {
            // Check facilitator's current balance as fallback
            const facilitatorBalance = await tokenContract.balanceOf(facilitatorAddress);
            const balanceFormatted = ethers.formatUnits(facilitatorBalance, decimals);

            return NextResponse.json({
                success: false,
                paymentVerified: false,
                message: `Payment not found. Please ensure you've transferred ${expectedAmount} ${tokenSymbol} to ${facilitatorAddress}`,
                data: {
                    facilitatorBalance: balanceFormatted,
                    expectedAmount: expectedAmount.toString(),
                    tokenSymbol,
                    searchedBlocks: `${fromBlock} to ${currentBlock}`,
                    eventsFound: events.length
                }
            });
        }

    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: error.message || 'Payment verification failed' },
            { status: 500 }
        );
    }
}

// GET method to check facilitator balance
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tokenSymbol = searchParams.get('token') || 'USDT';
        const facilitatorAddress = searchParams.get('address');

        if (!facilitatorAddress) {
            return NextResponse.json(
                { error: 'Facilitator address required' },
                { status: 400 }
            );
        }

        const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
        if (!tokenAddress) {
            return NextResponse.json(
                { error: 'Unsupported token' },
                { status: 400 }
            );
        }

        const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
        const tokenContract = new ethers.Contract(tokenAddress, USDT_ABI, provider);

        const balance = await tokenContract.balanceOf(facilitatorAddress);
        const decimals = await tokenContract.decimals();
        const balanceFormatted = ethers.formatUnits(balance, decimals);

        return NextResponse.json({
            success: true,
            data: {
                facilitatorAddress,
                tokenSymbol,
                balance: balanceFormatted,
                balanceWei: balance.toString()
            }
        });

    } catch (error: any) {
        console.error('Balance check error:', error);
        return NextResponse.json(
            { error: error.message || 'Balance check failed' },
            { status: 500 }
        );
    }
}