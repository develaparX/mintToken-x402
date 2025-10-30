import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// MyToken Contract ABI
const MYTOKEN_ABI = [
    "function addPaymentToken(address token, uint8 decimals) external",
    "function isPaymentTokenAccepted(address token) external view returns (bool)",
    "function owner() external view returns (address)"
];

// USD1 Token Configuration
const USD1_CONFIG = {
    address: "0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d",
    symbol: "USD1",
    name: "World Liberty Financial USD",
    decimals: 18
};

export async function POST(request: NextRequest) {
    try {
        console.log('Setting up USD1 as payment token...');

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

        console.log('Owner wallet address:', ownerWallet.address);
        console.log('Contract address:', contractAddress);
        console.log('USD1 address:', USD1_CONFIG.address);

        // Create contract instance
        const myTokenContract = new ethers.Contract(contractAddress, MYTOKEN_ABI, ownerWallet);

        // Verify we are the owner
        const contractOwner = await myTokenContract.owner();
        console.log('Contract owner:', contractOwner);

        if (contractOwner.toLowerCase() !== ownerWallet.address.toLowerCase()) {
            return NextResponse.json(
                {
                    error: 'Only contract owner can add payment tokens',
                    details: {
                        contractOwner,
                        walletAddress: ownerWallet.address
                    }
                },
                { status: 403 }
            );
        }

        // Check if USD1 is already accepted
        const isAlreadyAccepted = await myTokenContract.isPaymentTokenAccepted(USD1_CONFIG.address);
        console.log('USD1 already accepted:', isAlreadyAccepted);

        if (isAlreadyAccepted) {
            return NextResponse.json({
                success: true,
                message: 'USD1 is already configured as payment token',
                data: {
                    tokenAddress: USD1_CONFIG.address,
                    tokenSymbol: USD1_CONFIG.symbol,
                    decimals: USD1_CONFIG.decimals,
                    alreadyConfigured: true
                }
            });
        }

        console.log(`Adding USD1 payment token: ${USD1_CONFIG.symbol} (${USD1_CONFIG.address}) with ${USD1_CONFIG.decimals} decimals`);

        // Add USD1 as payment token
        const tx = await myTokenContract.addPaymentToken(USD1_CONFIG.address, USD1_CONFIG.decimals);
        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Verify USD1 was added successfully
        const isNowAccepted = await myTokenContract.isPaymentTokenAccepted(USD1_CONFIG.address);
        console.log('USD1 now accepted:', isNowAccepted);

        if (!isNowAccepted) {
            throw new Error('USD1 addition failed - not accepted after transaction');
        }

        return NextResponse.json({
            success: true,
            message: 'USD1 successfully configured as payment token',
            data: {
                tokenAddress: USD1_CONFIG.address,
                tokenSymbol: USD1_CONFIG.symbol,
                tokenName: USD1_CONFIG.name,
                decimals: USD1_CONFIG.decimals,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                bscscanUrl: `https://bscscan.com/tx/${tx.hash}`,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('Setup USD1 error:', error);

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
            {
                error: error.message || 'Failed to setup USD1',
                details: {
                    errorCode: error.code,
                    errorReason: error.reason
                }
            },
            { status: 500 }
        );
    }
}

// GET method to check USD1 status
export async function GET(request: NextRequest) {
    try {
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

        // Check if USD1 is accepted
        const isAccepted = await myTokenContract.isPaymentTokenAccepted(USD1_CONFIG.address);

        return NextResponse.json({
            success: true,
            data: {
                tokenAddress: USD1_CONFIG.address,
                tokenSymbol: USD1_CONFIG.symbol,
                tokenName: USD1_CONFIG.name,
                decimals: USD1_CONFIG.decimals,
                isAccepted,
                needsSetup: !isAccepted
            }
        });

    } catch (error: any) {
        console.error('Check USD1 status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check USD1 status' },
            { status: 500 }
        );
    }
}