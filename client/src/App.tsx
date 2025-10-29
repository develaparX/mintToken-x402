import { useState } from "react";
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
            className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-none text-white font-medium hover:bg-white/20 transition"
          >
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </button>
        ) : (
          <button
            onClick={() => open()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2 rounded-none text-white font-bold hover:from-purple-700 hover:to-blue-700 transition"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-2xl w-full bg-white/2 backdrop-blur-lg rounded-lg p-8 border border-white/5">
          {mintResult ? (
            <MintSuccess {...mintResult} onReset={() => setMintResult(null)} />
          ) : (
            <MintForm onMintSuccess={setMintResult} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
