import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// MyToken Contract ABI with payment functions (from deployed contract)
const MYTOKEN_ABI = [
    "function purchaseTokensGasless(address buyer, uint256 tokenAmount, address paymentToken, uint256 paymentAmount) external",
    "function calculatePayment(uint256 tokenAmount, address paymentToken) external view returns (uint256)",
    "function isPaymentTokenAccepted(address token) external view returns (bool)",
    "function publicSaleEnabled() external view returns (bool)",
    "function mintingEnabled() external view returns (bool)",
    "function getRemainingAllocations() external view returns (uint256, uint256, uint256, uint256)",
    "function tokenPrice() external view returns (uint256)",
    "function acceptedTokens(address) external view returns (bool)",
    "function USDT() external view returns (address)",
    "function USDC() external view returns (address)"
];

// USDT Contract ABI for balance checking
const USDT_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
];

// Token addresses on BSC
const TOKEN_ADDRESSES = {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    USD1: "0x55d398326f99059fF775485246999027B3197955" // Using USDT for now
};

export async function POST(request: NextRequest) {
    try {
        const { userAddress, tokenSymbol, tokenAmount, paymentReceived } = await request.json();

        // Validate input
        if (!userAddress || !tokenSymbol || !tokenAmount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!ethers.isAddress(userAddress)) {
            return NextResponse.json(
                { error: 'Invalid user address' },
                { status: 400 }
            );
        }

        // Get contract addresses
        const contractAddress = process.env.CONTRACT_ADDRESS;
        const paymentTokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];

        if (!contractAddress || !paymentTokenAddress) {
            return NextResponse.json(
                { error: 'Contract or token address not configured' },
                { status: 500 }
            );
        }

        // Initialize provider and facilitator wallet
        const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
        const facilitatorWallet = new ethers.Wallet(process.env.FACILITATOR_PRIVATE_KEY!, provider);

        // Create contract instances
        const myTokenContract = new ethers.Contract(contractAddress, MYTOKEN_ABI, facilitatorWallet);
        const paymentTokenContract = new ethers.Contract(paymentTokenAddress, USDT_ABI, provider);

        // Validate contract state
        const [mintingEnabled, publicSaleEnabled, paymentTokenAccepted] = await Promise.all([
            myTokenContract.mintingEnabled(),
            myTokenContract.publicSaleEnabled(),
            myTokenContract.isPaymentTokenAccepted(paymentTokenAddress)
        ]);

        if (!mintingEnabled) {
            return NextResponse.json(
                { error: 'Minting is currently disabled' },
                { status: 400 }
            );
        }

        if (!publicSaleEnabled) {
            return NextResponse.json(
                { error: 'Public sale is currently disabled' },
                { status: 400 }
            );
        }

        if (!paymentTokenAccepted) {
            return NextResponse.json(
                { error: `${tokenSymbol} is not accepted as payment` },
                { status: 400 }
            );
        }

        // Convert token amount to wei (18 decimals)
        const tokenAmountWei = ethers.parseEther(tokenAmount.toString());

        // Calculate required payment amount
        const requiredPayment = await myTokenContract.calculatePayment(tokenAmountWei, paymentTokenAddress);

        // Check if we have enough allocation remaining
        const [, , , publicRemaining] = await myTokenContract.getRemainingAllocations();
        if (publicRemaining < tokenAmountWei) {
            return NextResponse.json(
                { error: 'Insufficient tokens remaining for purchase' },
                { status: 400 }
            );
        }

        // For gasless transactions, we assume payment verification was done off-chain
        // In production, you'd want to verify the facilitator received the payment

        if (paymentReceived) {
            // Verify facilitator has enough BNB for gas
            const facilitatorBalance = await provider.getBalance(facilitatorWallet.address);
            const estimatedGas = ethers.parseEther("0.01"); // Estimate 0.01 BNB for gas

            if (facilitatorBalance < estimatedGas) {
                return NextResponse.json(
                    { error: 'Facilitator has insufficient BNB for gas fees' },
                    { status: 500 }
                );
            }

            // Execute gasless purchase
            const tx = await myTokenContract.purchaseTokensGasless(
                userAddress,
                tokenAmountWei,
                paymentTokenAddress,
                requiredPayment
            );

            // Wait for transaction confirmation
            const receipt = await tx.wait();

            const purchaseData = {
                purchaseId: `gasless_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                userAddress,
                tokenSymbol,
                tokenAmount: parseFloat(tokenAmount),
                paymentAmount: ethers.formatUnits(requiredPayment, 18),
                status: 'confirmed',
                timestamp: new Date().toISOString(),
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };

            return NextResponse.json({
                success: true,
                data: purchaseData,
                txHash: receipt.hash
            });
        } else {
            // Return payment instructions
            return NextResponse.json({
                success: true,
                requiresPayment: true,
                facilitatorAddress: facilitatorWallet.address,
                paymentToken: paymentTokenAddress,
                requiredPayment: ethers.formatUnits(requiredPayment, 18),
                tokenAmount: parseFloat(tokenAmount),
                instructions: `Transfer ${ethers.formatUnits(requiredPayment, 18)} ${tokenSymbol} to ${facilitatorWallet.address}`
            });
        }

    } catch (error: any) {
        console.error('Gasless purchase API error:', error);

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
            { error: error.message || 'Purchase processing failed' },
            { status: 500 }
        );
    }
}