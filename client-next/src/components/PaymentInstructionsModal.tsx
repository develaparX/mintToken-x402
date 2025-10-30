"use client";

import { useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface PaymentInstructionsModalProps {
  facilitatorAddress: string;
  amount: string;
  tokenSymbol: string;
  onPaymentCompleted: () => void;
  onCancel: () => void;
}

export const PaymentInstructionsModal = ({
  facilitatorAddress,
  amount,
  tokenSymbol,
  onPaymentCompleted,
  onCancel,
}: PaymentInstructionsModalProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Payment Required</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <span className="text-yellow-400 mr-2">⚠️</span>
              <span className="text-yellow-300 font-medium">
                Manual Transfer Required
              </span>
            </div>
            <p className="text-yellow-200 text-sm">
              Please transfer the exact amount to the facilitator address below.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount to Transfer:
              </label>
              <div className="bg-gray-800 border border-gray-600 rounded p-3">
                <div className="text-lg font-bold text-white">
                  {amount} {tokenSymbol}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Facilitator Address:
              </label>
              <div className="bg-gray-800 border border-gray-600 rounded p-3 flex items-center justify-between">
                <div className="text-sm text-white font-mono break-all mr-2">
                  {facilitatorAddress}
                </div>
                <button
                  onClick={() => copyToClipboard(facilitatorAddress)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded">
            <h4 className="text-blue-300 font-medium mb-2">Instructions:</h4>
            <ol className="text-blue-200 text-sm space-y-1">
              <li>1. Open your wallet (MetaMask, Trust Wallet, etc.)</li>
              <li>
                2. Send exactly{" "}
                <strong>
                  {amount} {tokenSymbol}
                </strong>{" "}
                to the address above
              </li>
              <li>3. Wait for transaction confirmation</li>
              <li>4. Click "I've Completed the Transfer" below</li>
            </ol>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onPaymentCompleted}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded transition-all duration-200"
          >
            I've Completed the Transfer
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            After clicking "I've Completed the Transfer", we'll verify your
            payment on the blockchain.
          </p>
        </div>
      </div>
    </div>
  );
};
