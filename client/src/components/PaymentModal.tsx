import { useState } from "react";
import { Wallet, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { ethers } from "ethers";
import { B402_CONFIG } from "../config";
import { connectWallet, createPaymentAuth, submitPayment } from "../lib/b402";
import { parseUnits } from "viem";
// Di bagian atas PaymentModal.tsx
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { wagmiAdapter } from "../main"; // pastikan ini mengekspor wagmiAdapter

// Bisa ditaruh di atas komponen atau di file terpisah seperti `constants/abi.ts`
const ERC20_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const tokens = [
  {
    name: "USDT",
    address: B402_CONFIG.TOKENS.USDT,
    color: "bg-green-500",
    icon: "₮",
  },
  {
    name: "USDC",
    address: B402_CONFIG.TOKENS.USDC,
    color: "bg-blue-500",
    icon: "⓿",
  },
];

export const PaymentModal = ({
  mintAmount,
  onSuccess,
  onClose,
}: {
  mintAmount: number;
  onSuccess: (data: any) => void;
  onClose: () => void;
}) => {
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [step, setStep] = useState("");

  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const handlePay = async () => {
    const totalPrice = (mintAmount * 10).toFixed(2);
    const tokenAddr = B402_CONFIG.TOKENS[
      selectedToken as keyof typeof B402_CONFIG.TOKENS
    ] as `0x${string}`;
    const relayerAddr = B402_CONFIG.RELAYER_ADDRESS as `0x${string}`;
    const userAddr = address as `0x${string}`;
    const amountInWei = parseUnits(totalPrice, 18);

    try {
      setStatus("processing");
      setError("");

      if (!isConnected || !address) {
        setStep("Opening wallet selector...");
        await open();
        return;
      }

      setStep("Validating wallet...");
      await connectWallet(address);

      // ✅ Cek allowance
      setStep("Checking token approval...");
      const allowance = await readContract(wagmiAdapter.wagmiConfig, {
        address: tokenAddr,
        abi: [
          {
            inputs: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
            ],
            name: "allowance",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "allowance",
        args: [userAddr, relayerAddr],
      });

      // ✅ Approve jika perlu
      if (allowance < amountInWei) {
        setStep("Approving token for gasless payment...");
        const hash = await writeContract(wagmiAdapter.wagmiConfig, {
          address: tokenAddr,
          abi: [
            {
              inputs: [
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
              ],
              name: "approve",
              outputs: [{ name: "", type: "bool" }],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          functionName: "approve",
          args: [relayerAddr, amountInWei],
        });
        await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash });
      }

      // ✅ LANJUT KE PEMBAYARAN
      setStep("Signing payment...");
      const auth = await createPaymentAuth(address, tokenAddr, totalPrice);

      if (!auth?.authorization || !auth.signature || !auth.tokenAddress) {
        throw new Error("Invalid authorization data");
      }

      setStep("Processing via B402...");
      const result = await submitPayment(auth);
      const txHash = result.transactionHash;

      if (!txHash) {
        console.error("[B402] Full result:", result);
        throw new Error("No transaction hash from B402");
      }

      setStep("Minting your token...");
      const mintRes = await fetch("http://localhost:3001/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, to: address, amount: mintAmount }),
      });

      if (!mintRes.ok) {
        const err = await mintRes.json();
        throw new Error(err.message || "Mint failed");
      }

      onSuccess({ txHash, address });
      setStatus("success");
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error("=== PAYMENT ERROR ===", err);
      setError(err.message || "Payment failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  if (status === "processing") {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-2xl text-center max-w-md w-full mx-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-500 mb-4" />
          <h3 className="text-white text-xl font-bold">Processing</h3>
          <p className="text-gray-400 mt-2">{step}</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-2xl text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-green-400">Success! Closing...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-white text-xl font-bold mb-4">
          Choose Payment Token
        </h3>

        {!isConnected && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <span className="text-blue-300 text-sm">
              Please connect your wallet first
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {tokens.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelectedToken(t.name)}
              className={`w-full p-3 rounded-xl border transition ${
                selectedToken === t.name
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 ${t.color} rounded-full flex items-center justify-center text-white font-bold`}
                  >
                    {t.icon}
                  </div>
                  <span className="text-white font-medium">{t.name}</span>
                </div>
                {selectedToken === t.name && (
                  <Check className="w-5 h-5 text-purple-400" />
                )}
              </div>
            </button>
          ))}
        </div>

        {isConnected ? (
          <button
            onClick={handlePay}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            <Wallet className="w-5 h-5" />
            Pay ${(mintAmount * 10).toFixed(2)} {selectedToken}
          </button>
        ) : (
          <button
            onClick={() => open()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
};
