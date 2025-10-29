import { B402_CONFIG } from '../config';
import { switchChain, signTypedData } from 'wagmi/actions';
import { wagmiAdapter } from '../main';

const BSC_CHAIN_ID = 56;

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



export const createPaymentAuth = async (
    from: string,
    token: string,
    amount: string
) => {
    console.log('[B402] Creating payment auth:', { from, token, amount });

    const nonce = '0x' + Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');

    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + 3600;

    const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18)).toString();

    console.log('[B402] Params:', {
        nonce,
        validAfter,
        validBefore,
        amountInWei
    });

    // ✅ B402 EIP-712 Domain - uses B402Relayer, NOT token name!
    const domain = {
        name: 'B402',               // ❗ BUKAN 'B402Relayer'
        version: '1',               // ❗ BUKAN '2'
        chainId: B402_CONFIG.CHAIN_ID,
        verifyingContract: B402_CONFIG.RELAYER_ADDRESS as `0x${string}`,
    };

    // ✅ B402 uses "Authorization" type (not "TransferWithAuthorization")
    const types = {
        TransferWithAuthorization: [  // ❗ BUKAN 'Authorization'
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
            primaryType: 'TransferWithAuthorization', // ✅ Sesuai tipe
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

export const submitPayment = async (authData: any) => {
    console.log('[B402] Submitting payment...', authData);

    // Validasi dasar
    if (!authData?.authorization || !authData?.signature || !authData?.tokenAddress) {
        throw new Error('Invalid authData: missing authorization, signature, or tokenAddress');
    }

    const { authorization, signature, tokenAddress } = authData;

    // ✅ Struktur payload SESUAI DENGAN send-usdt.ts
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
        // Verify
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

        // Settle
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
            ...settleData,
            transactionHash: settleData.transaction || settleData.txHash || settleData.transactionHash
        };
    } catch (error: any) {
        console.error('[B402] Payment submission error:', error);
        throw new Error(`Payment failed: ${error.message}`);
    }
};