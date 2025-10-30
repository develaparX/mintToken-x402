import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Token Contract ABI
const TOKEN_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)"
];

// Token addresses on BSC
const TOKEN_ADDRESSES = {
    USDT: "0x55d398326f99059fF775485246999027B3197955", // Tether USD
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USD Coin
    USD1: "0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d"  // World Liberty Financial USD
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userAddress = searchParams.get('userAddress');
        const tokenSymbol = searchParams.get('tokenSymbol') || 'USD1';

        if (!userAddress) {
            return NextResponse.json(
                { error: 'Missing userAddress parameter' },
                { status: 400 }
            );
        }

        if (!ethers.isAddress(userAddress)) {
            return NextResponse.json(
                { error: 'Invalid user address' },
                { status: 400 }
            );
        }

        const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];

        if (!tokenAddress) {
            return NextResponse.json(
                { error: `Token ${tokenSymbol} not supported` },
                { status: 400 }
            );
        }

        // Initialize provider
        const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);

        // Create token contract instance
        const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);

        try {
            // Get token info
            const [balance, decimals, symbol, name] = await Promise.all([
                tokenContract.balanceOf(userAddress),
                tokenContract.decimals(),
                tokenContract.symbol(),
                tokenContract.name()
            ]);

            const formattedBalance = ethers.formatUnits(balance, decimals);

            const debugInfo = {
                userAddress,
                tokenInfo: {
                    address: tokenAddress,
                    symbol: symbol,
                    name: name,
                    decimals: Number(decimals) // Convert BigInt to number
                },
                balance: {
                    raw: balance.toString(),
                    formatted: formattedBalance,
                    decimals: Number(decimals) // Convert BigInt to number
                },
                environment: {
                    BSC_RPC_URL: process.env.BSC_RPC_URL ? 'Set' : 'Not set',
                    USD1_TOKEN_ADDRESS: process.env.USD1_TOKEN_ADDRESS || 'Not set (using fallback)',
                    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS ? 'Set' : 'Not set'
                },
                timestamp: new Date().toISOString()
            };

            return NextResponse.json({
                success: true,
                data: debugInfo
            });

        } catch (contractError: any) {
            return NextResponse.json({
                success: false,
                error: 'Contract interaction failed',
                details: {
                    message: contractError.message,
                    tokenAddress,
                    userAddress,
                    rpcUrl: process.env.BSC_RPC_URL
                }
            });
        }

    } catch (error: any) {
        console.error('Debug token error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Debug failed',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}