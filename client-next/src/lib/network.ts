"use client";

import { bsc } from '@reown/appkit/networks';
import { useAccount, useSwitchChain } from 'wagmi';
import { useCallback } from 'react';

// BSC Network Configuration
export const BSC_NETWORK = {
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://bsc-dataseed.binance.org'],
        },
        public: {
            http: ['https://bsc-dataseed.binance.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'BSCScan',
            url: 'https://bscscan.com',
        },
    },
    contracts: {
        multicall3: {
            address: '0xca11bde05977b3631167028862be2a173976ca11',
            blockCreated: 15921452,
        },
    },
} as const;

// Hook for network management
export function useNetwork() {
    const { chain, chainId } = useAccount();
    const { switchChain, isPending: isSwitching } = useSwitchChain();

    const isCorrectNetwork = chainId === BSC_NETWORK.id;

    const switchToBSC = useCallback(async () => {
        if (!switchChain) return false;

        try {
            await switchChain({ chainId: BSC_NETWORK.id });
            return true;
        } catch (error) {
            console.error('Failed to switch to BSC:', error);
            return false;
        }
    }, [switchChain]);

    const getBSCScanUrl = useCallback((txHash: string) => {
        return `${BSC_NETWORK.blockExplorers.default.url}/tx/${txHash}`;
    }, []);

    const getBSCScanAddressUrl = useCallback((address: string) => {
        return `${BSC_NETWORK.blockExplorers.default.url}/address/${address}`;
    }, []);

    return {
        currentChain: chain,
        currentChainId: chainId,
        isCorrectNetwork,
        isSwitching,
        switchToBSC,
        getBSCScanUrl,
        getBSCScanAddressUrl,
        bscNetwork: BSC_NETWORK,
    };
}

// Utility functions
export function formatBNBAmount(amount: bigint | string | number): string {
    const value = typeof amount === 'bigint' ? amount.toString() : amount.toString();
    const num = parseFloat(value) / Math.pow(10, 18);
    return num.toFixed(4);
}

export function isValidBSCAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function shortenAddress(address: string, chars = 4): string {
    if (!isValidBSCAddress(address)) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}