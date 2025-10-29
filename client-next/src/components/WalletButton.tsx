"use client";

import { useWallet } from "@/hooks/useWallet";
import { useNetwork } from "@/lib/network";
import { useEffect, useState } from "react";

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className = "" }: WalletButtonProps) {
  const {
    isConnected,
    isConnecting,
    address,
    balanceFormatted,
    connectWallet,
    disconnectWallet,
    formatAddress,
    isClient,
  } = useWallet();

  const { isCorrectNetwork, switchToBSC, isSwitching } = useNetwork();
  const [showDropdown, setShowDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showDropdown]);

  // Don't render until client-side to avoid hydration mismatch
  if (!isClient) {
    return (
      <div
        className={`animate-pulse bg-gray-700 rounded px-4 py-2 ${className}`}
      >
        <div className="w-24 h-6 bg-gray-600 rounded"></div>
      </div>
    );
  }

  // Loading state
  if (isConnecting) {
    return (
      <button
        disabled
        className={`bg-gradient-to-r from-purple-500 to-blue-600 px-6 py-3 text-white font-bold uppercase tracking-wider opacity-75 cursor-not-allowed ${className}`}
        style={{
          boxShadow:
            "0 4px 0 rgba(147, 51, 234, 0.3), 0 6px 12px rgba(0,0,0,0.4)",
          border: "2px solid #fff",
          borderRadius: "4px",
          textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
        }}
      >
        Connecting...
      </button>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className={`bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-white font-black uppercase tracking-wider hover:from-pink-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
        style={{
          boxShadow: "0 6px 0 #4a0e4e, 0 8px 15px rgba(0,0,0,0.5)",
          border: "3px solid #fff",
          borderRadius: "0",
          textShadow: "2px 2px 0 rgba(0,0,0,0.6)",
        }}
      >
        Connect Wallet
      </button>
    );
  }

  // Wrong network state
  if (!isCorrectNetwork) {
    return (
      <button
        onClick={switchToBSC}
        disabled={isSwitching}
        className={`bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-white font-bold uppercase tracking-wider hover:from-orange-600 hover:to-red-700 transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
        style={{
          boxShadow:
            "0 4px 0 rgba(234, 88, 12, 0.5), 0 6px 12px rgba(0,0,0,0.4)",
          border: "2px solid #fff",
          borderRadius: "4px",
          textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
        }}
      >
        {isSwitching ? "Switching..." : "Switch to BSC"}
      </button>
    );
  }

  // Connected state with dropdown
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        className={`bg-white/10 backdrop-blur-md border-2 border-white/40 px-4 py-2 text-white font-bold uppercase tracking-wide hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
        style={{
          boxShadow:
            "0 4px 0 rgba(255,255,255,0.2), 0 6px 12px rgba(0,0,0,0.4)",
          borderRadius: "0",
          textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
        }}
      >
        {formatAddress(address)}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            {/* Address */}
            <div className="mb-3">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Address
              </div>
              <div className="text-sm text-white font-mono break-all">
                {address}
              </div>
            </div>

            {/* Balance */}
            <div className="mb-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                BNB Balance
              </div>
              <div className="text-sm text-white font-bold">
                {balanceFormatted} BNB
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  connectWallet();
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-sm text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                Change Wallet
              </button>
              <button
                onClick={() => {
                  disconnectWallet();
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
