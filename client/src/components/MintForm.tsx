import { useState, useEffect } from "react";
import { MINT_CONFIG } from "../config";
import { getRemainingSupply } from "../lib/supply";
import { PaymentModal } from "./PaymentModal";

export const MintForm = ({
  onMintSuccess,
}: {
  onMintSuccess: (data: any) => void;
}) => {
  const [mintAmount, setMintAmount] = useState(1);
  const [remaining, setRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // ← Tambahkan state ini

  useEffect(() => {
    getRemainingSupply()
      .then(setRemaining)
      .finally(() => setLoading(false));
  }, []);

  const handleMintClick = () => {
    if (remaining === 0) return;
    if (mintAmount > remaining) {
      alert(`Hanya tersisa ${remaining} token.`);
      return;
    }
    setShowModal(true); // ← Buka modal saat button diklik
  };

  if (loading)
    return <div className="text-center py-10 text-white">Loading...</div>;

  if (remaining === 0)
    return (
      <div className="text-center py-10 text-red-400 font-bold glitch-text">
        SOLD OUT!
      </div>
    );

  const totalPrice = (mintAmount * MINT_CONFIG.PRICE_PER_TOKEN).toFixed(2);
  const maxAllowed = Math.min(MINT_CONFIG.MAX_MINT, remaining);

  return (
    <>
      {/* <div className="text-center mb-6">
        <p className="text-sm text-gray-400">
          Tersisa: <strong>{remaining.toLocaleString()}</strong> /{" "}
          {MINT_CONFIG.TOTAL_SUPPLY.toLocaleString()}
        </p>
      </div> */}
      <div className="fixed -top-25 w-full">
        <h1
          className="text-7xl md:text-9xl font-black text-white mb-2 glitch-text"
          style={{ fontFamily: "'Honk', system-ui" }}
        >
          MY TOKEN
        </h1>
      </div>

      <div className="bg-black/40 rounded-xl p-4 mb-6">
        <input
          type="number"
          min={MINT_CONFIG.MIN_MINT}
          max={maxAllowed}
          value={mintAmount}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v >= MINT_CONFIG.MIN_MINT && v <= maxAllowed) {
              setMintAmount(v);
            }
          }}
          className="w-full bg-gray-900 border border-purple-500 rounded px-3 py-2 text-white text-center"
        />
        <p className="text-xs text-gray-500 mt-2">
          Min: ${totalPrice} • Max: {maxAllowed} • Total Supply: 10,000 MTK
        </p>
      </div>

      <button
        onClick={handleMintClick}
        disabled={mintAmount > remaining}
        className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 py-3 rounded font-bold text-white"
      >
        Pay ${totalPrice} & Get Token
      </button>

      {/* Modal hanya muncul jika showModal = true */}
      {showModal && (
        <PaymentModal
          mintAmount={mintAmount}
          onSuccess={(data) => {
            onMintSuccess(data);
            setShowModal(false); // Tutup modal setelah success
          }}
          onClose={() => setShowModal(false)} // Tutup modal saat X diklik
        />
      )}
    </>
  );
};
