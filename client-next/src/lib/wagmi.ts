"use client";

import { createAppKit } from '@reown/appkit/react'
import { bsc } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WAGMI_CONFIG } from './config'

// Setup queryClient with proper configuration
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
        },
    },
})

// Get projectId from environment
const projectId = WAGMI_CONFIG.PROJECT_ID

if (!projectId) {
    throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
}

// App metadata
const metadata = {
    name: 'MY TOKEN Mint DApp',
    description: 'Mint MY TOKEN with B402 Payment Gateway',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://mytoken.example.com',
    icons: ['/logo.png']
}

// Create Wagmi Adapter with BSC network
const wagmiAdapter = new WagmiAdapter({
    networks: [bsc],
    projectId,
    ssr: true
})

// AppKit instance management
let appKitInstance: any = null;

export function initializeAppKit() {
    if (typeof window !== 'undefined' && !appKitInstance) {
        appKitInstance = createAppKit({
            adapters: [wagmiAdapter],
            networks: [bsc],
            projectId,
            metadata,
            features: {
                analytics: true,
                email: false,
                socials: [],
            },
            themeMode: 'dark',
            themeVariables: {
                '--w3m-accent': '#8b5cf6',
                '--w3m-border-radius-master': '4px',
            }
        });
    }
    return appKitInstance;
}

export { wagmiAdapter, queryClient }