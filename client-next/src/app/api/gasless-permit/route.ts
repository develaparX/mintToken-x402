import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// USDT Contract ABI with Permit (EIP-2612)
const USDT_PERMIT_ABI = [
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function nonces(address owner) external view returns (uint256)",
    "function DOMAIN_SEPARATOR() external view returns (bytes32)",
    "function name() external view returns (string)"
];

// MyToken Contract ABI
const MYTOKEN_ABI = [
    "function purchaseTokensGasless(address buyer, uint256 tokenAmount, address paymentToken, uint256 paymentAmount) external",
    "function calculatePayment(uint256 tokenAmount, address paymentToken) external view returns (uint256)"
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
            tokenSymbol,
            tokenAmount,
            permitSignature
        } = await request.json();

        // Validate input
        if (!userAddress || !tokenSymbol || !tokenAmount || !permitSignature) {
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
        const usdtContract = new ethers.Contract(paymentTokenAddress, USDT_PERMIT_ABI, facilitatorWallet);

        // Convert token amount to wei
        const tokenAmountWei = ethers.parseEther(tokenAmount.toString());

        // Calculate required payment amount
        const requiredPayment = await myTokenContract.calculatePayment(tokenAmountWei, paymentTokenAddress);

        console.log(`Processing gasless payment: ${tokenAmount} MTK for ${ethers.formatEther(requiredPayment)} USDT`);

        // Verify user has sufficient balance
        const userBalance = await usdtContract.balanceOf(userAddress);
        if (userBalance < requiredPayment) {
            return NextResponse.json(
                { error: `Insufficient USDT balance. Required: ${ethers.formatEther(requiredPayment)}, Available: ${ethers.formatEther(userBalance)}` },
                { status: 400 }
            );
        }

        // Step 1: Execute permit (facilitator pays gas)
        console.log('Executing permit...');
        const permitTx = await usdtContract.permit(
            permitSignature.owner,
            permitSignature.spender,
            permitSignature.value,
            permitSignature.deadline,
            permitSignature.v,
            permitSignature.r,
            permitSignature.s
        );
        await permitTx.wait();
        console.log('Permit executed:', permitTx.hash);

        // Step 2: Transfer USDT from user to facilitator (facilitator pays gas)
        console.log('Transferring USDT...');
        const transferTx = await usdtContract.transferFrom(
            userAddress,
            facilitatorWallet.address,
            requiredPayment
        );
        await transferTx.wait();
        console.log('USDT transferred:', transferTx.hash);

        // Step 3: Mint tokens to user (facilitator pays gas)
        console.log('Minting tokens...');
        const mintTx = await myTokenContract.purchaseTokensGasless(
            userAddress,
            tokenAmountWei,
            paymentTokenAddress,
            requiredPayment
        );
        const mintReceipt = await mintTx.wait();
        console.log('Tokens minted:', mintTx.hash);

        const purchaseData = {
            purchaseId: `gasless_permit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            userAddress,
            tokenSymbol,
            tokenAmount: parseFloat(tokenAmount),
            paymentAmount: ethers.formatEther(requiredPayment),
            status: 'confirmed',
            timestamp: new Date().toISOString(),
            transactions: {
                permit: permitTx.hash,
                transfer: transferTx.hash,
                mint: mintTx.hash
            },
            finalTxHash: mintTx.hash,
            blockNumber: mintReceipt.blockNumber,
            gasUsed: {
                permit: (await permitTx.wait()).gasUsed.toString(),
                transfer: (await transferTx.wait()).gasUsed.toString(),
                mint: mintReceipt.gasUsed.toString()
            }
        };

        return NextResponse.json({
            success: true,
            message: 'Gasless payment completed successfully',
            data: purchaseData,
            txHash: mintTx.hash
        });

    } catch (error: any) {
        console.error('Gasless permit payment error:', error);

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
            { error: error.message || 'Gasless payment failed' },
            { status: 500 }
        );
    }
}

// GET method to get permit data for signing
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userAddress = searchParams.get('userAddress');
        const tokenSymbol = searchParams.get('tokenSymbol') || 'USDT';
        const tokenAmount = searchParams.get('tokenAmount');

        if (!userAddress || !tokenAmount) {
            return NextResponse.json(
                { error: 'Missing userAddress or tokenAmount' },
                { status: 400 }
            );
        }

        const paymentTokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
        const contractAddress = process.env.CONTRACT_ADDRESS;

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
        const myTokenContract = new ethers.Contract(contractAddress, MYTOKEN_ABI, provider);
        const usdtContract = new ethers.Contract(paymentTokenAddress, USDT_PERMIT_ABI, provider);

        // Calculate payment amount
        const tokenAmountWei = ethers.parseEther(tokenAmount);
        const requiredPayment = await myTokenContract.calculatePayment(tokenAmountWei, paymentTokenAddress);

        // Get permit data
        const nonce = await usdtContract.nonces(userAddress);
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const domainSeparator = await usdtContract.DOMAIN_SEPARATOR();
        const tokenName = await usdtContract.name();

        const permitData = {
            owner: userAddress,
            spender: facilitatorWallet.address,
            value: requiredPayment.toString(),
            nonce: nonce.toString(),
            deadline: deadline.toString(),
            domainSeparator,
            tokenName,
            tokenAddress: paymentTokenAddress,
            chainId: 56, // BSC Mainnet
            requiredPaymentFormatted: ethers.formatEther(requiredPayment)
        };

        return NextResponse.json({
            success: true,
            data: permitData
        });

    } catch (error: any) {
        console.error('Get permit data error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get permit data' },
            { status: 500 }
        );
    }
}