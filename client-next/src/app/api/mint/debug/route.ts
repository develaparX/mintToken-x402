import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Basic environment check
        const envCheck = {
            PRIVATE_KEY: !!process.env.PRIVATE_KEY,
            MINT_CONTRACT_ADDRESS: !!process.env.MINT_CONTRACT_ADDRESS,
            BSC_RPC_URL: !!process.env.BSC_RPC_URL,
            NODE_ENV: process.env.NODE_ENV,
        };

        // Simple connectivity test without initializing MintService
        let rpcTest = null;
        try {
            const rpcUrl = process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org';
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                rpcTest = {
                    status: 'success',
                    blockNumber: data.result,
                };
            } else {
                rpcTest = {
                    status: 'failed',
                    error: `HTTP ${response.status}`,
                };
            }
        } catch (error: any) {
            rpcTest = {
                status: 'error',
                error: error.message,
            };
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            environment: envCheck,
            rpcConnectivity: rpcTest,
            message: 'Debug information retrieved successfully',
        });

    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}