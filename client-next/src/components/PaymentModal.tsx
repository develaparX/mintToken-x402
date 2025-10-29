"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { B402_CONFIG } from "@/lib/config";
import { usePayment } from "@/hooks/usePayment";

interface PaymentModalProps {
  mintAmount: number;
  totalPrice: number;
  onSuccess: (data: { txHash: string; address: string }) => void;
  onClose: () => void;
}

export const PaymentModal = ({
  mintAmount,
  totalPrice,
  onSuccess,
  onClose,
}: PaymentModalProps) => {
  const [selectedToken, setSelectedToken] = useState("USDT");
  const { address } = useAccount();
  const { status, error, step, processPayment, mintToken, resetPayment } =
    usePayment();

  const tokens = [
    { symbol: "USDT", name: "Tether USD", address: B402_CONFIG.TOKENS.USDT },
    { symbol: "USDC", name: "USD Coin", address: B402_CONFIG.TOKENS.USDC },
    { symbol: "USD1", name: "USD1", address: B402_CONFIG.TOKENS.USD1 },
  ];

  const isProcessing = status !== "idle" && status !== "error";

  const handlePayment = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      resetPayment();

      // Process B402 payment
      const paymentTxHash = await processPayment(
        address,
        selectedToken,
        totalPrice.toString()
      );

      // Mint tokens after successful payment
      const mintResult = await mintToken(paymentTxHash, address, mintAmount);

      // Success callback
      onSuccess({
        txHash: mintResult.data?.mintTxHash || paymentTxHash,
        address: address,
      });
    } catch (error: any) {
      console.error("Payment failed:", error);
      // Error is already handled by usePayment hook
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Payment</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {status === "idle" && (
          <>
            <div className="mb-4 p-3 bg-gray-800 rounded">
              <div className="text-sm text-gray-400">You will receive:</div>
              <div className="text-lg font-bold text-white">
                {mintAmount} MY TOKEN
              </div>
              <div className="text-sm text-gray-400">
                Total: ${totalPrice} USD
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Payment Token:
              </label>
              <div className="space-y-2">
                {tokens.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => setSelectedToken(token.symbol)}
                    className={`w-full p-3 rounded border text-left transition-all ${
                      selectedToken === token.symbol
                        ? "border-purple-500 bg-purple-900/20"
                        : "border-gray-600 bg-gray-800 hover:border-gray-500"
                    }`}
                  >
                    <div className="font-medium text-white">{token.symbol}</div>
                    <div className="text-sm text-gray-400">{token.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={!address}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded transition-colors"
            >
              {!address
                ? "Connect Wallet First"
                : `Pay ${totalPrice} ${selectedToken}`}
            </button>
          </>
        )}

        {(status === "connecting" ||
          status === "approving" ||
          status === "signing" ||
          status === "processing") && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-white font-medium">Processing Payment...</div>
            <div className="text-sm text-gray-400 mt-2">
              {step || "Please confirm the transaction in your wallet"}
            </div>
          </div>
        )}

        {status === "minting" && (
          <div className="text-center py-8">
            <div className="animate-pulse w-8 h-8 bg-green-500 rounded-full mx-auto mb-4"></div>
            <div className="text-white font-medium">Minting Tokens...</div>
            <div className="text-sm text-gray-400 mt-2">
              {step || "Payment confirmed, minting your tokens..."}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-8">
            <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-sm">✕</span>
            </div>
            <div className="text-white font-medium">Payment Failed</div>
            <div className="text-sm text-red-400 mt-2 mb-4">
              {error || "An error occurred during payment"}
            </div>
            <button
              onClick={() => {
                resetPayment();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
