import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";
import "./index.css";
import App from "./App.tsx";

// 1. Setup QueryClient
const queryClient = new QueryClient();

// 2. Project ID dari Reown Cloud (https://cloud.reown.com) - Hardcoded untuk testing
const projectId = "a1b2c3d4e5f6789012345678901234567890abcd";
console.log("🔍 DEBUG: Project ID =", projectId);

// 3. Chains (konversi dari readonly ke mutable)
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc];

// 4. Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

// 5. Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: "MyToken Mint",
    description: "Mint MyToken with B402 Payment",
    url: window.location.origin,
    icons: [`${window.location.origin}/favicon.ico`],
  },
  themeMode: "dark",
  features: {
    analytics: false,
  },
});

// 6. Render App
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
