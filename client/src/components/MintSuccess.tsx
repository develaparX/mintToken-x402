import { Check, Copy, ExternalLink } from "lucide-react";

export const MintSuccess = ({
  txHash,
  address,
  onReset,
}: {
  txHash: string;
  address: string;
  onReset: () => void;
}) => {
  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="text-center py-6">
      <div className="w-20 h-20 bg-linear-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-10 h-10 text-white" />
      </div>
      <h3
        className="text-3xl font-bold text-white mb-2 glitch-text"
        style={{ fontFamily: "'Honk', system-ui" }}
      >
        Success!
      </h3>
      <p className="text-gray-300 mb-4">
        You received <strong>MyToken</strong>
      </p>

      <div className="space-y-3">
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded">
          <p className="text-xs text-gray-400">Minted to:</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <code className="text-purple-300 text-sm">
              {address.slice(0, 6)}...{address.slice(-4)}
            </code>
            <button
              onClick={() => copy(address)}
              className="text-purple-400 hover:text-purple-300"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        {txHash && (
          <a
            href={`https://bscscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
          >
            View on BSCScan <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <button
        onClick={onReset}
        className="mt-6 text-purple-400 hover:text-purple-300 text-sm font-semibold"
      >
        Mint Again
      </button>
    </div>
  );
};
