import { B402_CONFIG } from './config';
import { switchChain, signTypedData } from 'wagmi/actions';
import { wagmiAdapter } from './wagmi';

const BSC_CHAIN_ID = 56;

export interface PaymentAuth {
    authorization: {
        from: string;
        to: string;
        value: string;
        validAfter: number;
        validBefore: number;
        nonce: string;
    };
    signature: string;
    tokenAddress: string;
}

export interface PaymentResult {
    success: boolean;
    transactionHash: string;
    errorReason?: string;
}

/**
 * Connect wallet and ensure BSC network
 */
export const connectWallet = async (address: string): Promise<string> => {
    try {
        await switchChain(wagmiAdapter.wagmiConfig, { chainId: BSC_CHAIN_ID });
    } catch (error: any) {
        if (error.code === 4902) {
            throw new Error('Please add BSC network to your wallet');
        }
        throw error;
    }
    return address;
};

/**
 * Create B402 payment authorization with EIP-712 signature
 */
export const createPaymentAuth = async (
    from: string,
    token: string,
    amount: string
): Promise<PaymentAuth> => {
    console.log('[B402] Creating payment auth:', { from, token, amount });

    // Generate random nonce
    const nonce = '0x' + Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');

    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + 3600; // 1 hour validity

    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18)).toString();

    console.log('[B402] Params:', {
        nonce,
        validAfter,
        validBefore,
        amountInWei
    });

    // B402 EIP-712 Domain
    const domain = {
        name: 'B402',
        version: '1',
        chainId: B402_CONFIG.CHAIN_ID,
        verifyingContract: B402_CONFIG.RELAYER_ADDRESS as `0x${string}`,
    };

    // B402 uses "TransferWithAuthorization" type
    const types = {
        TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
        ],
    };

    const message = {
        from: from as `0x${string}`,
        to: B402_CONFIG.MERCHANT_ADDRESS as `0x${string}`,
        value: amountInWei,
        validAfter: BigInt(validAfter),
        validBefore: BigInt(validBefore),
        nonce: nonce as `0x${string}`,
    };

    console.log('[B402] Signing with domain:', domain);
    console.log('[B402] Message:', message);

    try {
        const signature = await signTypedData(wagmiAdapter.wagmiConfig, {
            domain,
            types,
            primaryType: 'TransferWithAuthorization',
            message,
        });

        console.log('[B402] ✅ Signature created:', signature);

        return {
            authorization: {
                from,
                to: B402_CONFIG.MERCHANT_ADDRESS,
                value: amountInWei,
                validAfter,
                validBefore,
                nonce,
            },
            signature,
            tokenAddress: token,
        };
    } catch (error: any) {
        console.error('[B402] ❌ Signature failed:', error);
        throw new Error(`Failed to sign payment: ${error.message}`);
    }
};

/**
 * Submit payment to B402 facilitator
 */
export const submitPayment = async (authData: PaymentAuth): Promise<PaymentResult> => {
    console.log('[B402] Submitting payment...', authData);

    // Validate input
    if (!authData?.authorization || !authData?.signature || !authData?.tokenAddress) {
        throw new Error('Invalid authData: missing authorization, signature, or tokenAddress');
    }

    const { authorization, signature, tokenAddress } = authData;

    // Structure payload according to B402 API
    const payload = {
        paymentPayload: {
            token: tokenAddress,
            payload: {
                authorization,
                signature,
            },
        },
        paymentRequirements: {
            relayerContract: B402_CONFIG.RELAYER_ADDRESS,
            network: 'bsc',
        },
    };

    console.log('[B402] Sending payload:', JSON.stringify(payload, null, 2));

    try {
        // Step 1: Verify payment
        const verifyRes = await fetch(`${B402_CONFIG.FACILITATOR_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const verifyData = await verifyRes.json();
        console.log('[B402] Verify response:', verifyData);

        if (!verifyRes.ok || !verifyData.isValid) {
            const errorMsg = verifyData.invalidReason || verifyData.message || 'Unknown verification error';
            throw new Error(`Verification failed: ${errorMsg}`);
        }

        // Step 2: Settle payment
        const settleRes = await fetch(`${B402_CONFIG.FACILITATOR_URL}/settle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const settleData = await settleRes.json();
        console.log('[B402] ✅ Settle response:', settleData);

        if (!settleRes.ok || !settleData.success) {
            throw new Error(settleData.errorReason || `Settlement failed: ${settleRes.status}`);
        }

        return {
            success: true,
            transactionHash: settleData.transaction || settleData.txHash || settleData.transactionHash,
            ...settleData
        };
    } catch (error: any) {
        console.error('[B402] Payment submission error:', error);
        throw new Error(`Payment failed: ${error.message}`);
    }
};

/**
 * Retry mechanism with exponential backoff
 */
export const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            if (attempt === maxRetries) {
                break;
            }

            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`[B402] Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
};