"use client";

export function GaslessInfo() {
  return (
    <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">⚡</span>
        <h3 className="text-lg font-bold text-green-400">B402 Gasless Mode</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="text-green-300 font-medium">✅ Benefits:</div>
          <ul className="text-gray-300 space-y-1">
            <li>• No BNB needed for gas fees</li>
            <li>• No wallet connection required</li>
            <li>• Instant transaction processing</li>
            <li>• Perfect for automation/agents</li>
          </ul>
        </div>

        <div className="space-y-2">
          <div className="text-blue-300 font-medium">🔧 How it works:</div>
          <ul className="text-gray-300 space-y-1">
            <li>• Enter your BSC address</li>
            <li>• Pay with USDT/USDC/USD1</li>
            <li>• Backend handles blockchain interaction</li>
            <li>• Tokens sent directly to your address</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/20 rounded">
        <div className="text-xs text-blue-200">
          <strong>Powered by B402 Protocol:</strong> Secure, gasless blockchain
          transactions with facilitator service handling all gas fees and wallet
          interactions.
        </div>
      </div>
    </div>
  );
}
