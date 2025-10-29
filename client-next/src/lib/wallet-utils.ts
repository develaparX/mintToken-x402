"use client";

import { type Address } from 'viem';
import { BSC_CONFIG } from './config';

/**
 * Wallet connection utilities for the Next.js application
 */

// Validate if an address is a valid Ethereum/BSC address
export function isValidAddress(address: string): address is Address {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Format address for display (shortened version)
export function formatAddress(address: string | undefined, chars = 4): string {
    if (!address || !isValidAddress(address)) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format balance for display
export function formatBalance(balance: bigint | undefined, decimals = 18, precision = 4): string {
    if (!balance) return '0';
    const divisor = BigInt(10 ** decimals);
    const quotient = balance / divisor;
    const remainder = balance % divisor;

    const quotientStr = quotient.toString();
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const decimalStr = remainderStr.slice(0, precision).replace(/0+$/, '');

    return decimalStr ? `${quotientStr}.${decimalStr}` : quotientStr;
}

// Get BSCScan URL for transaction
export function getBSCScanTxUrl(txHash: string): string {
    return `${BSC_CONFIG.BLOCK_EXPLORER}/tx/${txHash}`;
}

// Get BSCScan URL for address
export function getBSCScanAddressUrl(address: string): string {
    return `${BSC_CONFIG.BLOCK_EXPLORER}/address/${address}`;
}

// Check if we're on the correct network (BSC)
export function isCorrectNetwork(chainId: number | undefined): boolean {
    return chainId === BSC_CONFIG.CHAIN_ID;
}

// Network switching parameters for BSC
export function getBSCNetworkParams() {
    return {
        chainId: `0x${BSC_CONFIG.CHAIN_ID.toString(16)}`,
        chainName: BSC_CONFIG.CHAIN_NAME,
        nativeCurrency: BSC_CONFIG.NATIVE_CURRENCY,
        rpcUrls: BSC_CONFIG.RPC_URLS,
        blockExplorerUrls: [BSC_CONFIG.BLOCK_EXPLORER],
    };
}

// Wallet connection status helper
export interface WalletStatus {
    isConnected: boolean;
    isCorrectNetwork: boolean;
    address?: string;
    balance?: string;
    needsNetworkSwitch: boolean;
}

export function getWalletStatus(
    isConnected: boolean,
    chainId: number | undefined,
    address: string | undefined,
    balance: bigint | undefined
): WalletStatus {
    const isCorrectNet = isCorrectNetwork(chainId);

    return {
        isConnected,
        isCorrectNetwork: isCorrectNet,
        address,
        balance: formatBalance(balance),
        needsNetworkSwitch: isConnected && !isCorrectNet,
    };
}