import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// MyToken Contract ABI for price update
const MYTOKEN_ABI = [
    "function setTokenPrice(uint256 newPrice) external",
    "function tokenPrice() external view returns (uint256)",
    "function owner() external view returns (address)"
];

export async function POST(request: NextRequest) {
    try {
        const { newPrice } = await request.json();

        // Get contract configuration
        const contractAddress = process.env.CONTRACT_ADDRESS;
        const facilitatorPrivateKey = process.env.FACILITATOR_PRIVATE_KEY;
        const rpcUrl = process.env.BSC_RPC_URL;

        if (!contractAddress || !facilitatorPrivateKey || !rpcUrl) {
            return NextResponse.json(
                { error: 'Missing contract configuration' },
                { status: 500 }
            );
        }

        // Initialize provider and wallet
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const facilitatorWallet = new ethers.Wallet(facilitatorPrivateKey, provider);

        // Create contract instance
        const contract = new ethers.Contract(contractAddress, MYTOKEN_ABI, facilitatorWallet);

        // Check current price
        const currentPrice = await contract.tokenPrice();
        console.log('Current token price:', ethers.formatEther(currentPrice), 'USDT per token');

        // Verify facilitator is owner
        const owner = await contract.owner();
        if (facilitatorWallet.address.toLowerCase() !== owner.toLowerCase()) {
            return NextResponse.json(
                {
                    error: 'Facilitator is not contract owner',
                    facilitator: facilitatorWallet.address,
                    owner: owner
                },
                { status: 403 }
            );
        }

        // Set new price (default to 0.05 USDT per token = 5e16)
        const priceToSet = newPrice || "50000000000000000"; // 5e16 = 0.05 USDT per token

        console.log('Setting new token price:', ethers.formatEther(priceToSet), 'USDT per token');

        // Execute price update transaction
        const tx = await contract.setTokenPrice(priceToSet);
        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Verify new price
        const updatedPrice = await contract.tokenPrice();

        return NextResponse.json({
            success: true,
            message: 'Token price updated successfully',
            data: {
                previousPrice: ethers.formatEther(currentPrice),
                newPrice: ethers.formatEther(updatedPrice),
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            }
        });

    } catch (error: any) {
        console.error('Price update error:', error);

        // Handle specific errors
        if (error.code === 'INSUFFICIENT_FUNDS') {
            return NextResponse.json(
                { error: 'Facilitator wallet has insufficient BNB for gas fees' },
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
            { error: error.message || 'Price update failed' },
            { status: 500 }
        );
    }
}

// GET method to check current price
export async function GET() {
    try {
        const contractAddress = process.env.CONTRACT_ADDRESS;
        const rpcUrl = process.env.BSC_RPC_URL;

        if (!contractAddress || !rpcUrl) {
            return NextResponse.json(
                { error: 'Missing contract configuration' },
                { status: 500 }
            );
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(contractAddress, MYTOKEN_ABI, provider);

        const currentPrice = await contract.tokenPrice();
        const owner = await contract.owner();

        return NextResponse.json({
            success: true,
            data: {
                currentPrice: ethers.formatEther(currentPrice),
                currentPriceWei: currentPrice.toString(),
                owner: owner,
                contractAddress: contractAddress,
                calculation: {
                    oneToken: `${ethers.formatEther(currentPrice)} USDT`,
                    twentyTokens: `${(parseFloat(ethers.formatEther(currentPrice)) * 20).toFixed(2)} USDT`,
                    oneUSDT: `${(1 / parseFloat(ethers.formatEther(currentPrice))).toFixed(2)} tokens`
                }
            }
        });

    } catch (error: any) {
        console.error('Price check error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check price' },
            { status: 500 }
        );
    }
}