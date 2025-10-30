"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { LoadingSpinner } from "./LoadingSpinner";

interface BSCApprovalModalProps {
  approvalData: {
    userAddress: string;
    facilitatorAddress: string;
    tokenAddress: string;
    tokenSymbol: string;
    requiredPayment: string;
    requiredPaymentWei: string;
    currentAllowance: string;
    userBalance: string;
    needsApproval: boolean;
    hasSufficientBalance: boolean;
  };
  onApprovalCompleted: (txHash: string) => void;
  onCancel: () => void;
}

// Type for ethereum provider
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMetaMask?: boolean;
}

export const BSCApprovalModal = ({
  approvalData,
  onApprovalCompleted,
  onCancel,
}: BSCApprovalModalProps) => {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleApproval = async () => {
    try {
      setIsApproving(true);
      setError(null);

      // Check if window.ethereum is available
      const ethereum = (window as any).ethereum as EthereumProvider;
      if (!ethereum) {
        throw new Error(
          "No wallet detected. Please install MetaMask or another Web3 wallet."
        );
      }

      // Request account access
      await ethereum.request({ method: "eth_requestAccounts" });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(ethereum as any);
      const signer = await provider.getSigner();

      // Verify user address matches
      const userAddress = await signer.getAddress();
      if (
        userAddress.toLowerCase() !== approvalData.userAddress.toLowerCase()
      ) {
        throw new Error(`Please switch to account ${approvalData.userAddress}`);
      }

      // Create USDT contract instance
      const usdtContract = new ethers.Contract(
        approvalData.tokenAddress,
        [
          "function approve(address spender, uint256 amount) external returns (bool)",
          "function allowance(address owner, address spender) external view returns (uint256)",
        ],
        signer
      );

      // Execute approval transaction
      console.log("Approving USDT spending...");
      const approveTx = await usdtContract.approve(
        approvalData.facilitatorAddress,
        approvalData.requiredPaymentWei
      );

      console.log("Approval transaction sent:", approveTx.hash);

      // Wait for confirmation
      const receipt = await approveTx.wait();
      console.log("Approval confirmed in block:", receipt.blockNumber);

      // Verify approval was successful
      const newAllowance = await usdtContract.allowance(
        approvalData.userAddress,
        approvalData.facilitatorAddress
      );

      if (newAllowance < BigInt(approvalData.requiredPaymentWei)) {
        throw new Error("Approval failed. Please try again.");
      }

      onApprovalCompleted(approveTx.hash);
    } catch (error: any) {
      console.error("Approval error:", error);

      if (error.code === 4001) {
        setError("User rejected the approval transaction");
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        setError("Insufficient BNB for gas fees");
      } else {
        setError(error.message || "Approval failed");
      }
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Approval Required</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
            disabled={isApproving}
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <span className="text-blue-400 mr-2">ℹ️</span>
              <span className="text-blue-300 font-medium">
                One-Time Approval
              </span>
            </div>
            <p className="text-blue-200 text-sm">
              Approve the facilitator to spend your USDT. After approval, all
              future payments will be gasless!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount to Approve:
              </label>
              <div className="bg-gray-800 border border-gray-600 rounded p-3">
                <div className="text-lg font-bold text-white">
                  {approvalData.requiredPayment} {approvalData.tokenSymbol}
                </div>
                <div className="text-xs text-gray-400">
                  Current allowance: {approvalData.currentAllowance}{" "}
                  {approvalData.tokenSymbol}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Facilitator Address:
              </label>
              <div className="bg-gray-800 border border-gray-600 rounded p-3 flex items-center justify-between">
                <div className="text-sm text-white font-mono break-all mr-2">
                  {approvalData.facilitatorAddress}
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(approvalData.facilitatorAddress)
                  }
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {!approvalData.hasSufficientBalance && (
              <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
                <div className="text-red-300 text-sm">
                  ⚠️ Insufficient USDT balance. You need{" "}
                  {approvalData.requiredPayment} USDT but only have{" "}
                  {approvalData.userBalance} USDT.
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded">
              <div className="text-red-300 text-sm">{error}</div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={isApproving}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApproval}
            disabled={isApproving || !approvalData.hasSufficientBalance}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
          >
            {isApproving ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Approving...</span>
              </>
            ) : (
              `Approve ${approvalData.requiredPayment} ${approvalData.tokenSymbol}`
            )}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            This is a one-time approval. Future payments will be processed
            gaslessly by the facilitator.
          </p>
        </div>
      </div>
    </div>
  );
};
