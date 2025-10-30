"use client";

import { useState } from "react";

interface PaymentModeSelectorProps {
  onModeSelect: (mode: "wallet" | "gasless") => void;
}

export function PaymentModeSelector({
  onModeSelect,
}: PaymentModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<"wallet" | "gasless" | null>(
    null
  );

  const modes = [
    {
      id: "wallet" as const,
      title: "Wallet Mode",
      description: "Connect wallet, pay gas fees",
      pros: ["Full control", "Decentralized"],
      cons: ["Need BNB for gas", "Wallet popups"],
      icon: "🔗",
    },
    {
      id: "gasless" as const,
      title: "Gasless Mode (B402)",
      description: "No wallet needed, zero gas fees",
      pros: ["No gas fees", "No wallet popups", "Faster"],
      cons: ["Need to trust facilitator"],
      icon: "⚡",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white text-center mb-6">
        Choose Payment Mode
      </h3>

      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => {
            setSelectedMode(mode.id);
            onModeSelect(mode.id);
          }}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            selectedMode === mode.id
              ? "border-purple-500 bg-purple-900/30"
              : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{mode.icon}</span>
            <div className="flex-1">
              <h4 className="font-bold text-white mb-1">{mode.title}</h4>
              <p className="text-sm text-gray-300 mb-2">{mode.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-green-400 font-medium mb-1">Pros:</div>
                  {mode.pros.map((pro, i) => (
                    <div key={i} className="text-green-300">
                      • {pro}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-orange-400 font-medium mb-1">Cons:</div>
                  {mode.cons.map((con, i) => (
                    <div key={i} className="text-orange-300">
                      • {con}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
