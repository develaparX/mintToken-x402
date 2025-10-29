"use client";

interface MintSuccessProps {
  txHash: string;
  address: string;
  onReset: () => void;
}

export const MintSuccess = ({ txHash, address, onReset }: MintSuccessProps) => {
  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
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
        <h2 className="text-2xl font-bold text-white mb-2">
          Tokens Minted Successfully!
        </h2>
        <p className="text-gray-400">
          Your MY TOKEN has been sent to your wallet
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">
            Recipient Address:
          </label>
          <div className="text-white font-mono text-sm break-all">
            {address}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Transaction Hash:
          </label>
          <div className="text-white font-mono text-sm break-all">{txHash}</div>
        </div>
      </div>

      <div className="space-y-3">
        <a
          href={`https://bscscan.com/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          View on BSCScan
        </a>
        <button
          onClick={onReset}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          Mint More Tokens
        </button>
      </div>
    </div>
  );
};
