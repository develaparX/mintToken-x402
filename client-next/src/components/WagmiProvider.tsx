"use client";

import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiAdapter, queryClient, initializeAppKit } from "@/lib/wagmi";

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize AppKit on client side
    const init = async () => {
      try {
        await initializeAppKit();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize AppKit:", error);
        // Still set initialized to true to prevent blocking the app
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  // Prevent hydration mismatch by not rendering until initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-black to-purple-950">
        <div className="text-white text-lg">Initializing Web3...</div>
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
