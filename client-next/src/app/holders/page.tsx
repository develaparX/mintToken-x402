"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

interface Holder {
  TokenHolderAddress: string;
  TokenHolderQuantity: string;
}

interface HolderData {
  address: string;
  balance: string;
  balanceFormatted: string;
  percentage: number;
}

export default function HoldersPage() {
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState<string>("0");
  const [totalHolders, setTotalHolders] = useState(0);

  useEffect(() => {
    fetchHolders();
  }, []);

  const fetchHolders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch holders from API
      const response = await fetch("/api/holders");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch holders");
      }

      // Process holder data
      const processedHolders = data.holders.map((holder: Holder) => {
        const balance = holder.TokenHolderQuantity;
        const balanceFormatted = ethers.formatEther(balance);
        const percentage =
          data.totalSupply > 0
            ? (parseFloat(balanceFormatted) /
                parseFloat(ethers.formatEther(data.totalSupply))) *
              100
            : 0;

        return {
          address: holder.TokenHolderAddress,
          balance,
          balanceFormatted,
          percentage,
        };
      });

      // Sort by balance (highest first)
      processedHolders.sort(
        (a: HolderData, b: HolderData) =>
          parseFloat(b.balanceFormatted) - parseFloat(a.balanceFormatted)
      );

      setHolders(processedHolders);
      setTotalHolders(processedHolders.length);
      setTotalSupply(data.totalSupply || "0");
    } catch (error: any) {
      console.error("Error fetching holders:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: string) => {
    const number = parseFloat(num);
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(2)}M`;
    } else if (number >= 1000) {
      return `${(number / 1000).toFixed(2)}K`;
    }
    return number.toFixed(2);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openBSCScan = (address: string) => {
    window.open(`https://bscscan.com/address/${address}`, "_blank");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url(/anime-bg-2.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading token holders...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{
        backgroundImage: "url(/anime-bg-2.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 glitch-text">
            TOKEN HOLDERS
          </h1>
          <p className="text-gray-300 text-lg">
            View all MyToken (MTK) holders and their balances
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {totalHolders.toLocaleString()}
              </div>
              <div className="text-gray-300">Total Holders</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {formatNumber(ethers.formatEther(totalSupply))}
              </div>
              <div className="text-gray-300">Total Supply</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {holders.length > 0
                  ? formatNumber(holders[0].balanceFormatted)
                  : "0"}
              </div>
              <div className="text-gray-300">Top Holder</div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
            <div className="text-center">
              <div className="text-red-400 text-lg font-medium mb-2">
                Error Loading Holders
              </div>
              <div className="text-red-300 text-sm mb-4">{error}</div>
              <button
                onClick={fetchHolders}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Holders Table */}
        {!error && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {holders.map((holder, index) => (
                    <tr
                      key={holder.address}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0
                                ? "bg-yellow-500 text-black"
                                : index === 1
                                ? "bg-gray-400 text-black"
                                : index === 2
                                ? "bg-orange-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white font-mono">
                          {formatAddress(holder.address)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-white font-bold">
                          {formatNumber(holder.balanceFormatted)} MTK
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-purple-400 font-medium">
                          {holder.percentage.toFixed(4)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(holder.address)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                            title="Copy Address"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => openBSCScan(holder.address)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                            title="View on BSCScan"
                          >
                            BSCScan
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {holders.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No holders found</div>
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={fetchHolders}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
