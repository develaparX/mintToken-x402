import { useState } from "react";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { parseUnits } from "viem";
import { wagmiAdapter } from "../main";

export const useTokenApproval = () => {
    const [isChecking, setIsChecking] = useState(false);

    const checkAndApprove = async (
        tokenAddr: `0x${string}`,
        userAddr: `0x${string}`,
        relayerAddr: `0x${string}`,
        amount: string
    ) => {
        setIsChecking(true);
        try {
            const amountInWei = parseUnits(amount, 18);

            // Check allowance
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

            // Approve if needed
            if (allowance < amountInWei) {
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
                return { approved: true, hash };
            }

            return { approved: false, alreadyApproved: true };
        } finally {
            setIsChecking(false);
        }
    };

    return { checkAndApprove, isChecking };
};