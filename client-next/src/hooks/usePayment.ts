"use client";

import { useState } from "react";
import { createPaymentAuth, submitPayment, connectWallet } from "@/lib/b402";
import { useTokenApproval } from "./useTokenApproval";
import { B402_CONFIG } from "@/lib/config";

export type PaymentStatus = "idle" | "connecting" | "approving" | "signing" | "processing" | "minting" | "success" | "error";

export interface PaymentResult {
    txHash: string;
    mintTxHash?: string;
}

export const usePayment = () => {
    const [status, setStatus] = useState<PaymentStatus>("idle");
    const [error, setError] = useState<string>("");
    const [step, setStep] = useState<string>("");
    const { checkAndApprove } = useTokenApproval();

    const processPayment = async (
        address: string,
        tokenSymbol: string,
        totalPrice: string
    ): Promise<string> => {
        try {
            setStatus("connecting");
            setStep("Connecting to BSC network...");

            // Ensure wallet is connected to BSC
            await connectWallet(address);

            // Get token address from symbol
            const tokenAddr = B402_CONFIG.TOKENS[tokenSymbol as keyof typeof B402_CONFIG.TOKENS];
            if (!tokenAddr) {
                throw new Error(`Unsupported token: ${tokenSymbol}`);
            }

            setStatus("approving");
            setStep("Checking token approval...");

            // Check and approve token if needed
            const approvalResult = await checkAndApprove(
                tokenAddr as `0x${string}`,
                address as `0x${string}`,
                B402_CONFIG.RELAYER_ADDRESS as `0x${string}`,
                totalPrice
            );

            if (approvalResult.approved) {
                setStep("Token approval confirmed");
            } else if (approvalResult.alreadyApproved) {
                setStep("Token already approved");
            }

            setStatus("signing");
            setStep("Please sign the payment authorization...");

            // Create payment authorization
            const auth = await createPaymentAuth(address, tokenAddr, totalPrice);

            if (!auth?.authorization || !auth.signature || !auth.tokenAddress) {
                throw new Error("Invalid authorization data");
            }

            setStatus("processing");
            setStep("Processing payment via B402...");

            // Submit payment to B402
            const result = await submitPayment(auth);
            const txHash = result.transactionHash;

            if (!txHash) {
                console.error("[B402] Full result:", result);
                throw new Error("No transaction hash from B402");
            }

            console.log("[B402] ✅ Payment successful:", txHash);
            return txHash;

        } catch (error: any) {
            console.error("[Payment] ❌ Payment failed:", error);
            setStatus("error");
            setError(error.message || "Payment failed");
            throw error;
        }
    };

    const mintToken = async (txHash: string, address: string, amount: number): Promise<any> => {
        try {
            setStatus("minting");
            setStep("Minting your tokens...");

            const response = await fetch("/api/mint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ txHash, to: address, amount }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Mint request failed");
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Mint failed");
            }

            setStatus("success");
            setStep("Tokens minted successfully!");

            return result;
        } catch (error: any) {
            console.error("[Mint] ❌ Mint failed:", error);
            setStatus("error");
            setError(error.message || "Mint failed");
            throw error;
        }
    };

    const resetPayment = () => {
        setStatus("idle");
        setError("");
        setStep("");
    };

    return {
        status,
        error,
        step,
        processPayment,
        mintToken,
        resetPayment,
        setStatus,
        setError,
        setStep,
    };
};