import { useState } from "react";
import { Wallet, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { B402_CONFIG } from "../config";
import { connectWallet, createPaymentAuth, submitPayment } from "../lib/b402";

const tokens = [
  {
    name: "USDT",
    address: B402_CONFIG.TOKENS.USDT,
    color: "bg-green-500",
    icon: "₮",
  },
  {
    name: "USDC",
    address: B402_CONFIG.TOKENS.USDC,
    color: "bg-blue-500",
    icon: "⓿",
  },
  {
    name: "BUSD",
    address: B402_CONFIG.TOKENS.BUSD,
    color: "bg-yellow-500",
    icon: "Ⓑ",
  },
];

export const PaymentModal = ({
  mintAmount,
  onSuccess,
  onClose,
}: {
  mintAmount: number;
  onSuccess: (data: any) => void;
  onClose: () => void;
}) => {
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const handlePay = async () => {
    const totalPrice = (mintAmount * 10).toFixed(2);
    try {
      setStatus("processing");
      setError("");
      setStep("Connecting wallet...");

      const address = await connectWallet();
      if (!address) throw new Error("Wallet connection failed");
      setWalletAddress(address);

      setStep("Signing payment...");
      const tokenAddr =
        B402_CONFIG.TOKENS[selectedToken as keyof typeof B402_CONFIG.TOKENS];
      const auth = await createPaymentAuth(address, tokenAddr, totalPrice);

      setStep("Processing via B402...");
      const payload = {
        from: auth.authorization.from,
        to: auth.authorization.to,
        value: auth.authorization.value,
        validAfter: auth.authorization.validAfter,
        validBefore: auth.authorization.validBefore,
        nonce: auth.authorization.nonce,
        signature: auth.signature,
        token: auth.tokenAddress,
      };

      const result = await submitPayment(payload);
      const txHash = result.transactionHash;

      // 🔥 Kirim ke backend untuk mint
      setStep("Minting your token...");
      const mintRes = await fetch("http://localhost:3001/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, to: address, amount: mintAmount }),
      });

      if (!mintRes.ok) {
        const err = await mintRes.json();
        throw new Error(err.message || "Mint failed");
      }

      onSuccess({ txHash, address });
      setStatus("success");
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message || "Payment failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  if (status === "processing") {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-2xl text-center max-w-md w-full mx-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-500 mb-4" />
          <h3 className="text-white text-xl font-bold">Processing</h3>
          <p className="text-gray-400 mt-2">{step}</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-2xl text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-green-400">Success! Closing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-white text-xl font-bold mb-4">Choose Token</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {tokens.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelectedToken(t.name)}
              className={`w-full p-3 rounded-xl border ${
                selectedToken === t.name
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-700 bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 ${t.color} rounded-full flex items-center justify-center text-white font-bold`}
                  >
                    {t.icon}
                  </div>
                  <span className="text-white">{t.name}</span>
                </div>
                {selectedToken === t.name && (
                  <Check className="w-5 h-5 text-purple-400" />
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handlePay}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <Wallet className="w-5 h-5" />
          Pay ${(mintAmount * 10).toFixed(2)} {selectedToken}
        </button>
      </div>
    </div>
  );
};
