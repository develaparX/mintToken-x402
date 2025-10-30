"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getFacilitatorAddressClient } from "@/lib/facilitator";

interface ApprovalModalProps {
  tokenSymbol: string;
  amount: string;
  facilitatorAddress: string;
  userAddress: string;
  onApprovalSuccess: () => void;
  onClose: () => void;
}

export function ApprovalModal({
  tokenSymbol,
  amount,
  facilitatorAddress,
  userAddress,
  onApprovalSuccess,
  onClose,
}: ApprovalModalProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState("");
  const [currentAllowance, setCurrentAllowance] = useState("0");

  const TOKEN_ADDRESSES = {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    USD1: "0x55d398326f99059fF775485246999027B3197955",
  };

  const USDT_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
  ];

  useEffect(() => {
    checkCurrentAllowance();
  }, []);

  const checkCurrentAllowance = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const tokenAddress =
          TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
        const contract = new ethers.Contract(tokenAddress, USDT_ABI, provider);

        const decimals = await contract.decimals();
        const allowance = await contract.allowance(
          userAddress,
          facilitatorAddress
        );
        setCurrentAllowance(ethers.formatUnits(allowance, decimals));
      }
    } catch (error) {
      console.error("Error checking allowance:", error);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError("");

      if (!window.ethereum) {
        throw new Error("Please install MetaMask or another Web3 wallet");
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const tokenAddress =
        TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
      const contract = new ethers.Contract(tokenAddress, USDT_ABI, signer);

      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Approve the facilitator to spend tokens
      const tx = await contract.approve(facilitatorAddress, amountInWei);
      await tx.wait();

      onApprovalSuccess();
    } catch (error: any) {
      console.error("Approval failed:", error);
      setError(error.message || "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Approval Required</h3>
          <button
            onClick={onClose}
            disabled={isApproving}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <div className="text-blue-300 font-medium mb-2">
              🔐 One-Time Approval Needed
            </div>
            <div className="text-sm text-blue-200">
              To enable gasless payments, you need to approve our facilitator to
              spend your {tokenSymbol} tokens. This is a one-time setup per
              token.
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Token:</span>
              <span className="text-white font-medium">{tokenSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount to approve:</span>
              <span className="text-white font-medium">
                {amount} {tokenSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Current allowance:</span>
              <span className="text-white font-medium">
                {currentAllowance} {tokenSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Facilitator:</span>
              <span className="text-white font-mono text-xs">
                {facilitatorAddress.slice(0, 10)}...
                {facilitatorAddress.slice(-8)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded transition-all duration-200"
          >
            {isApproving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Approving...
              </div>
            ) : (
              `Approve ${amount} ${tokenSymbol}`
            )}
          </button>

          <div className="text-xs text-gray-500 text-center">
            After approval, all future payments will be gasless
          </div>
        </div>
      </div>
    </div>
  );
}
