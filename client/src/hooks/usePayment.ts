import { useState } from "react";
import { createPaymentAuth, submitPayment } from "../lib/b402";

export const usePayment = () => {
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [error, setError] = useState("");
    const [step, setStep] = useState("");

    const processPayment = async (
        address: string,
        tokenAddr: `0x${string}`,
        totalPrice: string
    ) => {
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

        return txHash;
    };

    const mintToken = async (txHash: string, address: string, amount: number) => {
        setStep("Minting your token...");
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

        const mintRes = await fetch(`${API_URL}/mint`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ txHash, to: address, amount }),
        });

        if (!mintRes.ok) {
            const err = await mintRes.json();
            throw new Error(err.message || "Mint failed");
        }

        return mintRes.json();
    };

    const resetError = () => {
        setError("");
        setStatus("idle");
    };

    return {
        status,
        error,
        step,
        setStatus,
        setError,
        setStep,
        processPayment,
        mintToken,
        resetError,
    };
};