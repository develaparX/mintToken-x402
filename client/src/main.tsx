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

// 2. Project ID dari Reown Cloud (https://cloud.reown.com)
const projectId =
  import.meta.env.VITE_PROJECT_ID || "c80c04ae7e39825387b6e2b9f8dd6fbe";

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
    url: "https://yourdomain.com",
    icons: ["https://yourdomain.com/icon.png"],
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
