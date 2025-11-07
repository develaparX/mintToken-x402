"use client";

import { useState, useEffect } from "react";
import { getRemainingSupply } from "@/lib/supply";
import { PaymentModal } from "./PaymentModal";
import { ethers } from "ethers";

export const MintForm = ({
  onMintSuccess,
}: {
  onMintSuccess: (data: any) => void;
}) => {
  const [mintAmount, setMintAmount] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  // Paket pembelian
  const packages = [
    { price: 1, tokens: 20 },
    { price: 5, tokens: 100 },
    { price: 10, tokens: 200 },
    { price: 100, tokens: 2000 },
  ];

  useEffect(() => {
    getRemainingSupply()
      .then(setRemaining)
      .finally(() => setLoading(false));

    // Check if wallet is already connected
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const address = await accounts[0].getAddress();
          setRecipientAddress(address);
          setWalletConnected(true);
        }
      }
    } catch (error) {
      console.log("No wallet connected");
    }
  };

  const handlePackageSelect = (pkg: (typeof packages)[0], index: number) => {
    if (remaining === 0) return;
    if (pkg.tokens > remaining) {
      alert(`Hanya tersisa ${remaining} token.`);
      return;
    }

    setSelectedPackage(index);
    setMintAmount(pkg.tokens);
    setShowModal(true);
  };

  if (loading)
    return <div className="text-center py-10 text-white">Loading...</div>;

  if (remaining === 0)
    return (
      <div className="text-center py-10 text-red-400 font-bold glitch-text">
        SOLD OUT!
      </div>
    );

  return (
    <>
      <div className="fixed -top-25 md:-top-15 w-full">
        <h1
          className="text-7xl md:text-5xl font-black text-white mb-2 glitch-text"
          style={{ fontFamily: "'Honk', system-ui" }}
        >
          MINT MY TOKEN
        </h1>
      </div>

      {/* Wallet Status */}
      {walletConnected && (
        <div className="mb-4">
          <div className="bg-green-900/20 border border-green-500/30 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-green-300 text-sm font-medium mb-1">
                  ✅ Wallet Connected
                </div>
                <div className="text-xs text-gray-300 font-mono break-all">
                  {recipientAddress}
                </div>
              </div>
              <button
                onClick={() => {
                  setWalletConnected(false);
                  setRecipientAddress("");
                }}
                className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        {packages.map((pkg, index) => {
          const isDisabled = pkg.tokens > remaining;
          return (
            <button
              key={index}
              onClick={() => handlePackageSelect(pkg, index)}
              disabled={isDisabled}
              className={`
                relative bg-gradient-to-br from-purple-900/50 to-blue-900/50 
                border rounded-md p-3 transition-all duration-300
                ${
                  isDisabled
                    ? "opacity-40 cursor-not-allowed border-gray-600"
                    : "border-purple-500 hover:border-purple-400 hover:scale-[1.02] hover:shadow-md hover:shadow-purple-500/50"
                }
              `}
            >
              {isDisabled && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-sm">
                  Habis
                </div>
              )}
              <div className="text-xl font-bold text-white mb-0.5">
                ${pkg.price}
              </div>
              <div className="text-[11px] text-gray-300">
                {pkg.tokens} Tokens
              </div>
              <div className="text-[9px] text-purple-300 mt-0.5">
                ${(pkg.price / pkg.tokens).toFixed(3)}/token
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-center text-xs text-gray-500">
        💳 Pembayaran menggunakan USDT/USDC/USD1
      </div>

      {/* Modal payment */}
      {showModal && selectedPackage !== null && (
        <PaymentModal
          mintAmount={mintAmount}
          totalPrice={packages[selectedPackage].price}
          recipientAddress={recipientAddress}
          onSuccess={(data) => {
            onMintSuccess(data);
            setShowModal(false);
            setSelectedPackage(null);
          }}
          onClose={() => {
            setShowModal(false);
            setSelectedPackage(null);
          }}
        />
      )}
    </>
  );
};
