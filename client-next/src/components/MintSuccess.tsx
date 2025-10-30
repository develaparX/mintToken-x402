"use client";

interface MintSuccessProps {
  txHash: string;
  address: string;
  onReset: () => void;
}

export function MintSuccess({ txHash, address, onReset }: MintSuccessProps) {
  const bscScanUrl = `https://bscscan.com/tx/${txHash}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="text-center py-8">
      {/* Success Icon */}
      <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-white mb-2">
        🎉 Tokens Minted Successfully!
      </h2>
      <p className="text-gray-300 mb-6">
        Your MY TOKEN has been minted and sent to your address via B402 gasless
        transaction.
      </p>

      {/* Transaction Details */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6 text-left">
        <div className="space-y-3">
          {/* Recipient Address */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Recipient Address
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-white font-mono bg-gray-900 px-2 py-1 rounded flex-1">
                {address}
              </code>
              <button
                onClick={() => copyToClipboard(address)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy address"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Transaction Hash */}
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Transaction Hash
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-white font-mono bg-gray-900 px-2 py-1 rounded flex-1 truncate">
                {txHash}
              </code>
              <button
                onClick={() => copyToClipboard(txHash)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy transaction hash"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* View on BSCScan */}
        <a
          href={bscScanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded transition-all duration-200 hover:scale-105 inline-block"
        >
          View on BSCScan 🔗
        </a>

        {/* Mint More */}
        <button
          onClick={onReset}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          Mint More Tokens
        </button>
      </div>

      {/* B402 Badge */}
      <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500/20 rounded">
        <div className="text-xs text-blue-200">
          ⚡ <strong>Powered by B402 Protocol:</strong> This transaction was
          processed gasless - you didn't need BNB for gas fees!
        </div>
      </div>
    </div>
  );
}
