import { useState } from "react";
import { Wallet, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { B402_CONFIG } from "../config";
import { connectWallet } from "../lib/b402";
import { useTokenApproval } from "../hooks/useTokenApproval";
import { usePayment } from "../hooks/usePayment";

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
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { checkAndApprove } = useTokenApproval();
  const {
    status,
    error,
    step,
    setStatus,
    setError,
    setStep,
    processPayment,
    mintToken,
    resetError,
  } = usePayment();

  const handlePay = async () => {
    if (!isConnected || !address) {
      setStep("Opening wallet selector...");
      await open();
      return;
    }

    const totalPrice = (mintAmount * 10).toFixed(2);
    const tokenAddr = B402_CONFIG.TOKENS[
      selectedToken as keyof typeof B402_CONFIG.TOKENS
    ] as `0x${string}`;
    const relayerAddr = B402_CONFIG.RELAYER_ADDRESS as `0x${string}`;
    const userAddr = address as `0x${string}`;

    try {
      setStatus("processing");
      setError("");

      // Step 1: Validate wallet
      setStep("Validating wallet...");
      await connectWallet(address);

      // Step 2: Check and approve token
      setStep("Checking token approval...");
      await checkAndApprove(tokenAddr, userAddr, relayerAddr, totalPrice);

      // Step 3: Process payment
      const txHash = await processPayment(address, tokenAddr, totalPrice);

      // Step 4: Mint token
      await mintToken(txHash, address, mintAmount);

      // Success
      onSuccess({ txHash, address });
      setStatus("success");
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error("=== PAYMENT ERROR ===", err);
      setError(err.message || "Payment failed");
      setStatus("error");
      setTimeout(resetError, 4000);
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
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-white text-xl font-bold mb-4">
          Choose Payment Token
        </h3>

        {!isConnected && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <span className="text-blue-300 text-sm">
              Please connect your wallet first
            </span>
          </div>
        )}

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
              className={`w-full p-3 rounded-xl border transition ${
                selectedToken === t.name
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 ${t.color} rounded-full flex items-center justify-center text-white font-bold`}
                  >
                    {t.icon}
                  </div>
                  <span className="text-white font-medium">{t.name}</span>
                </div>
                {selectedToken === t.name && (
                  <Check className="w-5 h-5 text-purple-400" />
                )}
              </div>
            </button>
          ))}
        </div>

        {isConnected ? (
          <button
            onClick={handlePay}
            className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            <Wallet className="w-5 h-5" />
            Pay ${(mintAmount * 10).toFixed(2)} {selectedToken}
          </button>
        ) : (
          <button
            onClick={() => open()}
            className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
};
