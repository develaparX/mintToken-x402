import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function GET(request: NextRequest) {
    try {
        const contractAddress = process.env.CONTRACT_ADDRESS || '0x4720f69e8E3c06AcD5F6711061e8d3f2916706AF';
        const rpcUrl = process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';

        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Test 1: Check if address has code
        const code = await provider.getCode(contractAddress);
        const hasCode = code !== '0x';

        let testResults = {
            contractAddress,
            rpcUrl,
            hasCode,
            codeLength: code.length,
            tests: {} as any
        };

        if (!hasCode) {
            return NextResponse.json({
                success: false,
                message: 'Contract address has no code - not deployed or invalid address',
                data: testResults
            });
        }

        // Test 2: Try basic ERC20 functions
        const basicABI = [
            "function name() external view returns (string)",
            "function symbol() external view returns (string)",
            "function totalSupply() external view returns (uint256)",
            "function decimals() external view returns (uint8)"
        ];

        const basicContract = new ethers.Contract(contractAddress, basicABI, provider);

        try {
            const name = await basicContract.name();
            testResults.tests.name = { success: true, value: name };
        } catch (e: any) {
            testResults.tests.name = { success: false, error: e.message };
        }

        try {
            const symbol = await basicContract.symbol();
            testResults.tests.symbol = { success: true, value: symbol };
        } catch (e: any) {
            testResults.tests.symbol = { success: false, error: e.message };
        }

        try {
            const totalSupply = await basicContract.totalSupply();
            testResults.tests.totalSupply = {
                success: true,
                value: ethers.formatEther(totalSupply),
                raw: totalSupply.toString()
            };
        } catch (e: any) {
            testResults.tests.totalSupply = { success: false, error: e.message };
        }

        // Test 3: Try MyToken specific functions (updated for new contract)
        const myTokenABI = [
            "function getRemainingAllocations() external view returns (uint256, uint256, uint256, uint256)",
            "function publicMinted() external view returns (uint256)",
            "function MINT_ALLOCATION() external view returns (uint256)",
            "function mintingEnabled() external view returns (bool)",
            "function publicSaleEnabled() external view returns (bool)",
            "function tokenPrice() external view returns (uint256)",
            "function acceptedTokens(address) external view returns (bool)",
            "function USDT() external view returns (address)",
            "function USDC() external view returns (address)"
        ];

        const myTokenContract = new ethers.Contract(contractAddress, myTokenABI, provider);

        try {
            const allocations = await myTokenContract.getRemainingAllocations();
            testResults.tests.getRemainingAllocations = {
                success: true,
                value: {
                    airdrop: ethers.formatEther(allocations[0]),
                    bayc: ethers.formatEther(allocations[1]),
                    liquidity: ethers.formatEther(allocations[2]),
                    public: ethers.formatEther(allocations[3])
                }
            };
        } catch (e: any) {
            testResults.tests.getRemainingAllocations = { success: false, error: e.message };
        }

        try {
            const publicMinted = await myTokenContract.publicMinted();
            testResults.tests.publicMinted = {
                success: true,
                value: ethers.formatEther(publicMinted)
            };
        } catch (e: any) {
            testResults.tests.publicMinted = { success: false, error: e.message };
        }

        try {
            const mintAllocation = await myTokenContract.MINT_ALLOCATION();
            testResults.tests.MINT_ALLOCATION = {
                success: true,
                value: ethers.formatEther(mintAllocation)
            };
        } catch (e: any) {
            testResults.tests.MINT_ALLOCATION = { success: false, error: e.message };
        }

        try {
            const mintingEnabled = await myTokenContract.mintingEnabled();
            testResults.tests.mintingEnabled = {
                success: true,
                value: mintingEnabled
            };
        } catch (e: any) {
            testResults.tests.mintingEnabled = { success: false, error: e.message };
        }

        try {
            const publicSaleEnabled = await myTokenContract.publicSaleEnabled();
            testResults.tests.publicSaleEnabled = {
                success: true,
                value: publicSaleEnabled
            };
        } catch (e: any) {
            testResults.tests.publicSaleEnabled = { success: false, error: e.message };
        }

        try {
            const tokenPrice = await myTokenContract.tokenPrice();
            testResults.tests.tokenPrice = {
                success: true,
                value: ethers.formatEther(tokenPrice),
                raw: tokenPrice.toString()
            };
        } catch (e: any) {
            testResults.tests.tokenPrice = { success: false, error: e.message };
        }

        try {
            const usdtAddress = await myTokenContract.USDT();
            testResults.tests.USDT = {
                success: true,
                value: usdtAddress
            };
        } catch (e: any) {
            testResults.tests.USDT = { success: false, error: e.message };
        }

        try {
            const usdcAddress = await myTokenContract.USDC();
            testResults.tests.USDC = {
                success: true,
                value: usdcAddress
            };
        } catch (e: any) {
            testResults.tests.USDC = { success: false, error: e.message };
        }

        // Test accepted tokens
        try {
            const usdtAccepted = await myTokenContract.acceptedTokens("0x55d398326f99059fF775485246999027B3197955");
            testResults.tests.usdtAccepted = {
                success: true,
                value: usdtAccepted
            };
        } catch (e: any) {
            testResults.tests.usdtAccepted = { success: false, error: e.message };
        }

        // Determine overall success
        const successfulTests = Object.values(testResults.tests).filter((test: any) => test.success).length;
        const totalTests = Object.keys(testResults.tests).length;

        return NextResponse.json({
            success: successfulTests > 0,
            message: `Contract test completed: ${successfulTests}/${totalTests} tests passed`,
            data: testResults
        });

    } catch (error: any) {
        console.error('Contract test error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Contract test failed',
                error: error.message
            },
            { status: 500 }
        );
    }
}