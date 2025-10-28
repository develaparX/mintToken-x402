import { useState } from "react";
import { MintForm } from "./components/MintForm";
import { MintSuccess } from "./components/MintSuccess";

function App() {
  const [mintResult, setMintResult] = useState<{
    txHash: string;
    address: string;
  } | null>(null);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950 via-black to-purple-950 animate-gradient"></div>
      <div className="fixed inset-0 opacity-30 animate-pulse-slow">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-transparent to-blue-900/40"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-2xl w-full bg-white/5 backdrop-blur-lg rounded-none p-8 border border-white/3">
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
