"use client";

import { useState } from "react";
import { useB402Payment } from "@/hooks/useB402Payment";
import { LoadingSpinner } from "./LoadingSpinner";
import { ApprovalModal } from "./ApprovalModal";
import { BSCApprovalModal } from "./BSCApprovalModal";
import { PaymentInstructionsModal } from "./PaymentInstructionsModal";
import { getFacilitatorAddressClient } from "@/lib/facilitator";

interface PaymentModalProps {
  mintAmount: number;
  totalPrice: number;
  recipientAddress: string;
  onSuccess: (data: { txHash: string; address: string }) => void;
  onClose: () => void;
}

export const PaymentModal = ({
  mintAmount,
  totalPrice,
  recipientAddress,
  onSuccess,
  onClose,
}: PaymentModalProps) => {
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showBSCApprovalModal, setShowBSCApprovalModal] = useState(false);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null);
  const [approvalData, setApprovalData] = useState<any>(null);
  const [useTrueGasless, setUseTrueGasless] = useState(true); // Default to true gasless
  const {
    status,
    error,
    step,
    processGaslessPayment,
    continueAfterPayment,
    processTrueGaslessPayment,
    continueAfterApproval,
    reset,
  } = useB402Payment();

  const tokens = [
    { symbol: "USDT", name: "Tether USD" },
    { symbol: "USDC", name: "USD Coin" },
    { symbol: "USD1", name: "USD1" },
  ];

  const isProcessing = status !== "idle" && status !== "error";

  const handlePayment = async () => {
    try {
      reset();

      if (useTrueGasless) {
        // True Gasless: User approves once, facilitator pays gas for transfer + mint
        const result = await processTrueGaslessPayment(
          recipientAddress,
          selectedToken,
          mintAmount // Token amount user receives
        );

        // Check if approval is required
        if (result && result.requiresApproval) {
          setApprovalData(result.approvalData);
          setShowBSCApprovalModal(true);
          return;
        }

        // Success callback
        onSuccess({
          txHash: result.txHash,
          address: recipientAddress,
        });
      } else {
        // Semi-gasless: User transfers USDT manually, facilitator pays mint gas
        const result = await processGaslessPayment(
          recipientAddress,
          selectedToken,
          totalPrice.toString(), // USDT amount user pays
          mintAmount // Token amount user receives
        );

        // Check if payment instructions are required
        if (result && result.requiresPayment) {
          setPaymentInstructions(result.paymentInstructions);
          setShowPaymentInstructions(true);
          return;
        }

        // Success callback
        onSuccess({
          txHash: result.txHash,
          address: recipientAddress,
        });
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      // Error is already handled by useB402Payment hook
    }
  };

  const handlePaymentCompleted = async () => {
    try {
      setShowPaymentInstructions(false);

      // Continue with payment verification and token minting
      const result = await continueAfterPayment(
        recipientAddress,
        selectedToken,
        mintAmount,
        paymentInstructions
      );

      // Success callback
      onSuccess({
        txHash: result.txHash,
        address: recipientAddress,
      });
    } catch (error: any) {
      console.error("Payment continuation failed:", error);
      setShowPaymentInstructions(false);
      // Error is already handled by useB402Payment hook
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentInstructions(false);
    setPaymentInstructions(null);
    reset();
  };

  const handleApprovalSuccess = () => {
    setShowApprovalModal(false);
    // Retry payment after successful approval
    handlePayment();
  };

  const handleApprovalCompleted = async (txHash: string) => {
    try {
      setShowBSCApprovalModal(false);

      // Continue with gasless payment after approval
      const result = await continueAfterApproval(
        recipientAddress,
        selectedToken,
        mintAmount,
        txHash
      );

      // Success callback
      onSuccess({
        txHash: result.txHash,
        address: recipientAddress,
      });
    } catch (error: any) {
      console.error("Payment continuation after approval failed:", error);
      setShowBSCApprovalModal(false);
      // Error is already handled by useB402Payment hook
    }
  };

  const handleApprovalCancel = () => {
    setShowBSCApprovalModal(false);
    setApprovalData(null);
    reset();
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
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💰</span>
                  <span className="text-white font-medium">Payment Method</span>
                </div>
              </div>

              {/* Gasless Mode Toggle */}
              <div className="mb-4 p-3 bg-gray-800 border border-gray-600 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Payment Mode</span>
                  <button
                    onClick={() => setUseTrueGasless(!useTrueGasless)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      useTrueGasless
                        ? "bg-green-600 text-white"
                        : "bg-gray-600 text-gray-300"
                    }`}
                  >
                    {useTrueGasless ? "True Gasless" : "Semi-Gasless"}
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  {useTrueGasless
                    ? "🚀 Zero gas fees! Just approve once in wallet."
                    : "⚡ Manual USDT transfer required."}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800 border border-gray-600 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">₮</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {selectedToken}
                      </div>
                      <div className="text-sm text-gray-400">Tether USD</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    Total: ${totalPrice} USD
                  </div>
                </div>
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
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded transition-all duration-200 hover:scale-105"
            >
              {useTrueGasless
                ? `🚀 Pay ${totalPrice} ${selectedToken} (Zero Gas!)`
                : `⚡ Pay ${totalPrice} ${selectedToken} (Semi-Gasless)`}
            </button>
          </>
        )}

        {status === "processing" && (
          <div className="text-center py-8">
            <LoadingSpinner
              size="lg"
              color="purple"
              text="Processing B402 Payment..."
            />
            <div className="text-sm text-gray-400 mt-2">
              {step || "Processing your gasless payment..."}
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" color="green" text="Minting Tokens..." />
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
                reset();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <ApprovalModal
          tokenSymbol={selectedToken}
          amount={totalPrice.toString()}
          facilitatorAddress={getFacilitatorAddressClient()}
          userAddress={recipientAddress}
          onApprovalSuccess={handleApprovalSuccess}
          onClose={() => {
            setShowApprovalModal(false);
          }}
        />
      )}

      {/* BSC Approval Modal */}
      {showBSCApprovalModal && approvalData && (
        <BSCApprovalModal
          approvalData={approvalData}
          onApprovalCompleted={handleApprovalCompleted}
          onCancel={handleApprovalCancel}
        />
      )}

      {/* Payment Instructions Modal */}
      {showPaymentInstructions && paymentInstructions && (
        <PaymentInstructionsModal
          facilitatorAddress={paymentInstructions.facilitatorAddress}
          amount={paymentInstructions.requiredPayment}
          tokenSymbol={selectedToken}
          onPaymentCompleted={handlePaymentCompleted}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};
