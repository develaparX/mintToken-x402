"use client";

import { useState, useEffect } from "react";
import { getMintingStatus } from "@/lib/supply";

export function TokenStats() {
  const [stats, setStats] = useState({
    enabled: true,
    remaining: 0,
    minted: 0,
    total: 700000,
    progress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const mintingStats = await getMintingStatus();
        setStats(mintingStats);
      } catch (error) {
        console.error("Failed to fetch token stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900/50 to-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Remaining Supply */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {stats.remaining.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Remaining
          </div>
        </div>

        {/* Minted */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {stats.minted.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Minted
          </div>
        </div>

        {/* Total Allocation */}
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Total Public
          </div>
        </div>

        {/* Progress */}
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {stats.progress.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Progress
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Public Mint Progress</span>
          <span>{stats.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(stats.progress, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            stats.enabled ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span className="text-xs text-gray-400">
          Minting {stats.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {/* Warning if low supply */}
      {stats.remaining < 1000 && stats.remaining > 0 && (
        <div className="mt-3 p-2 bg-orange-900/20 border border-orange-500/30 rounded text-center">
          <div className="text-xs text-orange-400">
            ⚠️ Low supply remaining! Only {stats.remaining.toLocaleString()}{" "}
            tokens left
          </div>
        </div>
      )}

      {/* Sold out indicator */}
      {stats.remaining === 0 && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-center">
          <div className="text-xs text-red-400 font-bold">
            🔥 SOLD OUT! All public tokens have been minted
          </div>
        </div>
      )}
    </div>
  );
}
