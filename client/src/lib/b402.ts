import { B402_CONFIG } from '../config';

export const connectWallet = async (): Promise<string | null> => {
    if (typeof window.ethereum === 'undefined') return null;
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0x38') {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
        } catch (err: any) {
            if (err.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x38',
                        chainName: 'BNB Smart Chain Mainnet',
                        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                        rpcUrls: ['https://bsc-dataseed.binance.org'],
                        blockExplorerUrls: ['https://bscscan.com'],
                    }],
                });
            } else throw err;
        }
    }
    return accounts[0];
};

export const createPaymentAuth = async (from: string, token: string, amount: string) => {
    const nonce = '0x' + Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + 3600;
    const amountInWei = Math.floor(parseFloat(amount) * 1e18).toString();

    const domain = {
        name: 'B402Relayer',
        version: '2',
        chainId: B402_CONFIG.CHAIN_ID,
        verifyingContract: B402_CONFIG.RELAYER_ADDRESS,
    };

    const types = {
        Authorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
        ],
    };

    const value = {
        from,
        to: B402_CONFIG.MERCHANT_ADDRESS,
        value: amountInWei,
        validAfter,
        validBefore,
        nonce,
    };

    const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [from, JSON.stringify({ domain, types, primaryType: 'Authorization', message: value })],
    });

    return { authorization: value, signature, tokenAddress: token };
};

export const submitPayment = async (payload: any) => {
    const verifyRes = await fetch(`${B402_CONFIG.FACILITATOR_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!verifyRes.ok) throw new Error('Verify failed');

    const settleRes = await fetch(`${B402_CONFIG.FACILITATOR_URL}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!settleRes.ok) throw new Error('Settle failed');

    return await settleRes.json();
};