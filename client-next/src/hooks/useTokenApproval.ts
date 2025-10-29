"use client";

import { useState } from "react";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { parseUnits } from "viem";
import { wagmiAdapter } from "@/lib/wagmi";

export interface ApprovalResult {
    approved: boolean;
    alreadyApproved?: boolean;
    hash?: string;
}

export const useTokenApproval = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkAndApprove = async (
        tokenAddr: `0x${string}`,
        userAddr: `0x${string}`,
        relayerAddr: `0x${string}`,
        amount: string
    ): Promise<ApprovalResult> => {
        setIsChecking(true);
        setError(null);

        try {
            const amountInWei = parseUnits(amount, 18);

            console.log('[TokenApproval] Checking allowance:', {
                token: tokenAddr,
                user: userAddr,
                spender: relayerAddr,
                amount: amountInWei.toString()
            });

            // Check current allowance
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

            console.log('[TokenApproval] Current allowance:', allowance.toString());

            // If allowance is sufficient, no approval needed
            if (allowance >= amountInWei) {
                console.log('[TokenApproval] ✅ Sufficient allowance, no approval needed');
                return { approved: false, alreadyApproved: true };
            }

            console.log('[TokenApproval] Insufficient allowance, requesting approval...');

            // Request approval for the exact amount needed
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

            console.log('[TokenApproval] Approval transaction sent:', hash);

            // Wait for transaction confirmation
            await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, { hash });

            console.log('[TokenApproval] ✅ Approval confirmed');

            return { approved: true, hash };
        } catch (error: any) {
            console.error('[TokenApproval] ❌ Approval failed:', error);
            const errorMessage = error.message || 'Token approval failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsChecking(false);
        }
    };

    const resetError = () => {
        setError(null);
    };

    return {
        checkAndApprove,
        isChecking,
        error,
        resetError,
    };
};