"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { MintForm } from "@/components/MintForm";
import { MintSuccess } from "@/components/MintSuccess";
import { WalletButton } from "@/components/WalletButton";

export default function Home() {
  const [mintResult, setMintResult] = useState<{
    txHash: string;
    address: string;
  } | null>(null);
  const [bnbAddress, setBnbAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-CA"); // Format: YYYY/MM/DD
  };

  const handleClaimAirdrop = () => {
    if (!bnbAddress.trim()) {
      setClaimMessage("Please enter your BNB address");
      return;
    }
    setIsChecking(true);
    setClaimMessage("");

    // Simulate checking process
    setTimeout(() => {
      setIsChecking(false);
      setClaimMessage("Sorry, this address is not eligible for the airdrop.");
    }, 2000);
  };

  // Load Honk font
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Honk&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950 via-black to-purple-950 animate-gradient"></div>
      <div className="fixed inset-0 opacity-30 animate-pulse-slow">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-transparent to-blue-900/40"></div>
      </div>

      {/* Connect Button */}
      <div className="fixed top-4 right-4 z-20">
        <WalletButton />
      </div>

      {/* Airdrop Section - Full Screen */}
      <section
        className="relative h-screen flex items-center justify-center px-4"
        style={{
          backgroundImage: "url(/bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="max-w-md w-full relative z-10 flex flex-col items-center">
          {/* Logo - Diperkecil */}
          <div className="mb-6">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-24 h-24 object-contain drop-shadow-xl"
            />
          </div>

          {/* Title - dengan style glitch seperti yang diminta */}
          <h1
            className="text-7xl md:text-6xl font-black text-white mb-6 text-center glitch-text"
            style={{ fontFamily: "'Honk', system-ui" }}
          >
            MY TOKEN
          </h1>

          {/* Input - Lebih ramping */}
          <div className="w-full max-w-xs mb-4">
            <input
              type="text"
              value={bnbAddress}
              onChange={(e) => setBnbAddress(e.target.value)}
              placeholder="Enter BNB Address"
              className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all text-center text-sm"
              style={{
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Claim Button - Lebih ramping */}
          <button
            onClick={handleClaimAirdrop}
            disabled={isChecking}
            className="w-full max-w-xs bg-black/70 backdrop-blur-sm border border-gray-700 px-4 py-3 text-gray-400 font-bold uppercase tracking-wider hover:bg-black/80 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            style={{
              borderRadius: "4px",
            }}
          >
            {isChecking ? "Checking..." : "Claim Airdrop"}
          </button>

          {/* Terms Checkbox */}
          <div className="flex items-center justify-center mt-4 text-xs">
            <input
              type="checkbox"
              id="terms"
              className="mr-2 w-3.5 h-3.5 accent-green-500"
            />
            <label htmlFor="terms" className="text-gray-400">
              I Agree to the{" "}
              <span className="text-green-500 cursor-pointer hover:underline">
                Terms of Service
              </span>
            </label>
          </div>

          {/* Message */}
          {claimMessage && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-center font-medium rounded text-sm max-w-xs w-full">
              {claimMessage}
            </div>
          )}
        </div>

        {/* Social Media Icons - Bottom Right */}
        <div className="absolute bottom-8 right-8 flex gap-4 z-10">
          <a
            href="#"
            className="text-white hover:text-green-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="#"
            className="text-white hover:text-green-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a
            href="#"
            className="text-white hover:text-green-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418z" />
            </svg>
          </a>
        </div>

        {/* Date/Time - Bottom Right (above social icons) */}
        <div className="absolute bottom-20 right-8 text-right z-10">
          <div className="text-white text-sm font-medium">
            {formatTime(currentTime)}
          </div>
          <div className="text-gray-400 text-xs">{formatDate(currentTime)}</div>
        </div>
      </section>

      {/* Mint Section - Full Screen */}
      <section className="relative h-screen flex items-center justify-center px-4">
        {/* Konten utama (form atau success) */}
        <div className="max-w-2xl w-full z-10">
          <div className="bg-white/5 backdrop-blur-lg rounded-sm py-8 px-6 border border-white/10 shadow-2xl">
            {mintResult ? (
              <MintSuccess
                {...mintResult}
                onReset={() => setMintResult(null)}
              />
            ) : (
              <MintForm onMintSuccess={setMintResult} />
            )}
          </div>
        </div>

        {/* Footer - dipastikan di paling bawah layar */}
        <footer className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <p className="text-gray-400 text-sm text-center">
            © 2025 MY TOKEN. All rights reserved.
          </p>
        </footer>
      </section>
    </div>
  );
}
