import { NextRequest, NextResponse } from 'next/server';
import { MintService } from '@/lib/mint-service';
import { createErrorResponse, createSuccessResponse } from '@/lib/validation';

// Lazy initialize mint service
let mintService: MintService | null = null;

function getMintService(): MintService {
    if (!mintService) {
        mintService = new MintService();
    }
    return mintService;
}

interface HealthCheck {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    message: string;
    details?: any;
    responseTime?: number;
}

export async function GET(request: NextRequest) {
    const startTime = Date.now();
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    const healthChecks: HealthCheck[] = [];
    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';

    try {
        const service = getMintService();

        // Check 1: Wallet Balance
        try {
            const checkStart = Date.now();
            const walletBalance = await service.getWalletBalance();
            const balanceNum = parseFloat(walletBalance);

            const walletCheck: HealthCheck = {
                name: 'wallet_balance',
                status: balanceNum > 0.01 ? 'healthy' : balanceNum > 0.001 ? 'warning' : 'error',
                message: `Wallet balance: ${walletBalance} BNB`,
                responseTime: Date.now() - checkStart,
            };

            if (detailed) {
                walletCheck.details = {
                    balance: walletBalance + ' BNB',
                    balanceWei: balanceNum.toString(),
                    canMint: balanceNum > 0.01,
                    lowBalanceWarning: balanceNum <= 0.01,
                };
            }

            healthChecks.push(walletCheck);
            if (walletCheck.status === 'error') {
                overallStatus = 'error';
            } else if (walletCheck.status === 'warning' && overallStatus === 'healthy') {
                overallStatus = 'warning';
            }
        } catch (error: any) {
            healthChecks.push({
                name: 'wallet_balance',
                status: 'error',
                message: `Wallet check failed: ${error.message}`,
            });
            overallStatus = 'error';
        }

        // Check 2: Contract Balance
        try {
            const checkStart = Date.now();
            const contractBalance = await service.getContractBalance();

            healthChecks.push({
                name: 'contract_balance',
                status: 'healthy',
                message: `Contract balance: ${contractBalance} BNB`,
                responseTime: Date.now() - checkStart,
                ...(detailed && {
                    details: {
                        balance: contractBalance + ' BNB',
                    }
                }),
            });
        } catch (error: any) {
            healthChecks.push({
                name: 'contract_balance',
                status: 'error',
                message: `Contract check failed: ${error.message}`,
            });
            overallStatus = 'error';
        }

        // Check 3: Distribution Status (Contract Connectivity)
        try {
            const checkStart = Date.now();
            const [distributionStatus, remainingAllocations] = await Promise.all([
                service.getDistributionStatus(),
                service.getRemainingAllocations()
            ]);

            const totalRemaining = Object.values(remainingAllocations)
                .reduce((sum, val) => sum + parseFloat(val), 0);

            const statusCheck: HealthCheck = {
                name: 'contract_connectivity',
                status: 'healthy',
                message: `Contract accessible, ${totalRemaining.toLocaleString()} tokens remaining`,
                responseTime: Date.now() - checkStart,
            };

            if (detailed) {
                statusCheck.details = {
                    totalMinted: distributionStatus.totalMinted,
                    totalRemaining: totalRemaining.toLocaleString(),
                    allocations: remainingAllocations,
                    mintingActive: totalRemaining > 0,
                };
            }

            healthChecks.push(statusCheck);
        } catch (error: any) {
            healthChecks.push({
                name: 'contract_connectivity',
                status: 'error',
                message: `Contract connectivity failed: ${error.message}`,
            });
            overallStatus = 'error';
        }

        // Check 4: Environment Configuration
        try {
            const envCheck: HealthCheck = {
                name: 'environment_config',
                status: 'healthy',
                message: 'Environment configuration valid',
            };

            const requiredEnvVars = ['PRIVATE_KEY', 'MINT_CONTRACT_ADDRESS'];
            const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

            if (missingVars.length > 0) {
                envCheck.status = 'error';
                envCheck.message = `Missing environment variables: ${missingVars.join(', ')}`;
                overallStatus = 'error';
            }

            if (detailed) {
                envCheck.details = {
                    requiredVariables: requiredEnvVars,
                    missingVariables: missingVars,
                    configurationValid: missingVars.length === 0,
                };
            }

            healthChecks.push(envCheck);
        } catch (error: any) {
            healthChecks.push({
                name: 'environment_config',
                status: 'error',
                message: `Environment check failed: ${error.message}`,
            });
            overallStatus = 'error';
        }

        // Compile health response
        const totalResponseTime = Date.now() - startTime;
        const healthData = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            responseTime: totalResponseTime,
            checks: healthChecks,
            summary: {
                total: healthChecks.length,
                healthy: healthChecks.filter(c => c.status === 'healthy').length,
                warnings: healthChecks.filter(c => c.status === 'warning').length,
                errors: healthChecks.filter(c => c.status === 'error').length,
            },
        };

        // Return appropriate status code based on health
        const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'warning' ? 200 : 503;

        return NextResponse.json(healthData, { status: statusCode });

    } catch (error: any) {
        console.error('Health check error:', error);

        return createErrorResponse(
            'Health check system failure',
            503,
            {
                errorType: error.constructor.name,
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime,
            }
        );
    }
}