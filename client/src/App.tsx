import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { MintForm } from "./components/MintForm";
import { MintSuccess } from "./components/MintSuccess";

function App() {
  const [mintResult, setMintResult] = useState<{
    txHash: string;
    address: string;
  } | null>(null);
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  // Load Honk font
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Honk&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950 via-black to-purple-950 animate-gradient"></div>
      <div className="fixed inset-0 opacity-30 animate-pulse-slow">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-transparent to-blue-900/40"></div>
      </div>

      {/* Connect Button */}
      <div className="absolute top-4 right-4 z-20">
        {isConnected ? (
          <button
            onClick={() => open()}
            className="bg-white/10 backdrop-blur-md border-2 border-white/40 px-4 py-2 text-white font-bold uppercase tracking-wide hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              boxShadow:
                "0 4px 0 rgba(255,255,255,0.2), 0 6px 12px rgba(0,0,0,0.4)",
              borderRadius: "0",
              textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
            }}
          >
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </button>
        ) : (
          <button
            onClick={() => open()}
            className="bg-linear-to-r from-pink-500 to-purple-600 px-6 py-3 text-white font-black uppercase tracking-wider hover:from-pink-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              boxShadow: "0 6px 0 #4a0e4e, 0 8px 15px rgba(0,0,0,0.5)",
              border: "3px solid #fff",
              borderRadius: "0",
              textShadow: "2px 2px 0 rgba(0,0,0,0.6)",
            }}
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="max-w-2xl w-full flex-1 flex items-center relative z-0">
          <div className="w-full">
            {/* Card Content */}
            <div className="bg-white/5 backdrop-blur-lg rounded-sm pt-15 pb-8 px-8 border border-white/10 shadow-2xl relative">
              {mintResult ? (
                <MintSuccess
                  {...mintResult}
                  onReset={() => setMintResult(null)}
                />
              ) : (
                <MintForm onMintSuccess={setMintResult} />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center relative z-0">
          <p className="text-gray-400 text-sm">
            © 2025 MY TOKEN. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
