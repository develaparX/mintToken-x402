"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useCallback, useEffect, useState } from 'react';
import { formatEther } from 'viem';

export function useWallet() {
    const { address, isConnected, isConnecting, isReconnecting } = useAccount();
    const { disconnect } = useDisconnect();
    const { open, close } = useAppKit();
    const [isClient, setIsClient] = useState(false);

    // Get BNB balance
    const { data: balance, isLoading: isBalanceLoading } = useBalance({
        address,
        chainId: 56, // BSC mainnet
    });

    useEffect(() => {
        setIsClient(true);
    }, []);

    const connectWallet = useCallback(async () => {
        try {
            await open();
        } catch (error) {
            console.error('Failed to open wallet modal:', error);
        }
    }, [open]);

    const disconnectWallet = useCallback(async () => {
        try {
            await disconnect();
            close();
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    }, [disconnect, close]);

    const formatAddress = useCallback((addr?: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }, []);

    const formatBalance = useCallback((bal?: bigint) => {
        if (!bal) return '0';
        const formatted = formatEther(bal);
        return parseFloat(formatted).toFixed(4);
    }, []);

    return {
        // Connection state
        address,
        isConnected: isClient && isConnected,
        isConnecting: isConnecting || isReconnecting,

        // Balance
        balance: balance?.value,
        balanceFormatted: formatBalance(balance?.value),
        isBalanceLoading,

        // Actions
        connectWallet,
        disconnectWallet,

        // Utilities
        formatAddress,
        formatBalance,

        // Client-side check
        isClient,
    };
}