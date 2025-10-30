import { useState } from 'react';
import { PermitSigner, type PermitData, type PermitSignature } from '@/lib/permit-signer';

interface B402PaymentState {
    status: 'idle' | 'processing' | 'success' | 'error';
    step: string;
    error: string | null;
}

export function useB402Payment() {
    const [state, setState] = useState<B402PaymentState>({
        status: 'idle',
        step: '',
        error: null
    });

    const processGaslessPayment = async (
        userAddress: string,
        tokenSymbol: string,
        paymentAmount: string,
        tokenAmount: number
    ) => {
        try {
            setState({
                status: 'processing',
                step: 'Getting payment instructions...',
                error: null
            });

            // Step 1: Get payment instructions
            const instructionsResponse = await fetch('/api/purchase-gasless', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress,
                    tokenSymbol,
                    tokenAmount, // Amount of tokens user wants to receive
                    paymentReceived: false
                })
            });

            if (!instructionsResponse.ok) {
                const errorData = await instructionsResponse.json();
                throw new Error(errorData.error || 'Failed to get payment instructions');
            }

            const instructionsData = await instructionsResponse.json();

            if (instructionsData.requiresPayment) {
                // Return payment instructions for UI to handle
                setState({
                    status: 'processing',
                    step: 'waiting_for_payment',
                    error: null
                });

                // Return payment instructions to be handled by UI
                return {
                    requiresPayment: true,
                    paymentInstructions: instructionsData
                };
            }

            setState({
                status: 'processing',
                step: 'Verifying payment received...',
                error: null
            });

            // Verify payment was actually received
            const verificationResponse = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress,
                    facilitatorAddress: instructionsData.facilitatorAddress,
                    tokenSymbol,
                    expectedAmount: instructionsData.requiredPayment,
                    timeWindow: 600 // 10 minutes
                })
            });

            const verificationData = await verificationResponse.json();

            if (!verificationData.paymentVerified) {
                throw new Error(verificationData.message || 'Payment not verified. Please ensure you have transferred the required amount.');
            }

            console.log('Payment verified:', verificationData.data);

            // Step 2: Execute gasless purchase (after payment received)
            const purchaseResponse = await fetch('/api/purchase-gasless', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress,
                    tokenSymbol,
                    tokenAmount,
                    paymentReceived: true
                })
            });

            if (!purchaseResponse.ok) {
                const errorData = await purchaseResponse.json();
                throw new Error(errorData.error || 'Purchase failed');
            }

            const purchaseData = await purchaseResponse.json();

            setState({
                status: 'success',
                step: 'Tokens purchased successfully!',
                error: null
            });

            return {
                txHash: purchaseData.txHash,
                purchaseData: purchaseData.data
            };

        } catch (error: any) {
            setState({
                status: 'error',
                step: '',
                error: error.message
            });
            throw error;
        }
    };

    const continueAfterPayment = async (
        userAddress: string,
        tokenSymbol: string,
        tokenAmount: number,
        paymentInstructions: any
    ) => {
        try {
            setState({
                status: 'processing',
                step: 'Verifying payment received...',
                error: null
            });

            // Verify payment was actually received
            const verificationResponse = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress,
                    facilitatorAddress: paymentInstructions.facilitatorAddress,
                    tokenSymbol,
                    expectedAmount: paymentInstructions.requiredPayment,
                    timeWindow: 600 // 10 minutes
                })
            });

            const verificationData = await verificationResponse.json();

            if (!verificationData.paymentVerified) {
                throw new Error(verificationData.message || 'Payment not verified. Please ensure you have transferred the required amount.');
            }

            console.log('Payment verified:', verificationData.data);

            setState({
                status: 'processing',
                step: 'Payment verified, minting tokens...',
                error: null
            });

            // Execute gasless purchase (after payment received)
            const purchaseResponse = await fetch('/api/purchase-gasless', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress,
                    tokenSymbol,
                    tokenAmount,
                    paymentReceived: true
                })
            });

            if (!purchaseResponse.ok) {
                const errorData = await purchaseResponse.json();
                throw new Error(errorData.error || 'Purchase failed');
            }

            const purchaseData = await purchaseResponse.json();

            setState({
                status: 'success',
                step: 'Tokens purchased successfully!',
                error: null
            });

            return {
                txHash: purchaseData.txHash,
                purchaseData: purchaseData.data
            };

        } catch (error: any) {
            setState({
                status: 'error',
                step: '',
                error: error.message
            });
            throw error;
        }
    };

    const processTrueGaslessPayment = async (
        userAddress: string,
        tokenSymbol: string,
        tokenAmount: number
    ) => {
        try {
            setState({
                status: 'processing',
                step: 'Checking approval status...',
                error: null
            });

            // Step 1: Check approval status
            const approvalResponse = await fetch(
                `/api/gasless-approval?userAddress=${userAddress}&tokenSymbol=${tokenSymbol}&tokenAmount=${tokenAmount}`
            );

            if (!approvalResponse.ok) {
                const errorData = await approvalResponse.json();
                throw new Error(errorData.error || 'Failed to check approval status');
            }

            const { data: approvalData } = await approvalResponse.json();

            // Step 2: If approval needed, request user to approve
            if (approvalData.needsApproval) {
                setState({
                    status: 'processing',
                    step: 'Please approve USDT spending in your wallet...',
                    error: null
                });

                // Return approval instructions for UI to handle
                return {
                    requiresApproval: true,
                    approvalData: approvalData
                };
            }

            setState({
                status: 'processing',
                step: 'Processing gasless payment...',
                error: null
            });

            // Step 3: Execute gasless payment (facilitator pays gas for transfer + mint)
            const gaslessResponse = await fetch('/api/gasless-approval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress,
                    tokenSymbol,
                    tokenAmount
                })
            });

            if (!gaslessResponse.ok) {
                const errorData = await gaslessResponse.json();
                throw new Error(errorData.error || 'Gasless payment failed');
            }

            const gaslessData = await gaslessResponse.json();

            setState({
                status: 'success',
                step: 'Payment completed! Tokens received, facilitator paid gas fees!',
                error: null
            });

            return {
                txHash: gaslessData.txHash,
                purchaseData: gaslessData.data,
                transactions: gaslessData.data.transactions
            };

        } catch (error: any) {
            setState({
                status: 'error',
                step: '',
                error: error.message
            });
            throw error;
        }
    };

    const continueAfterApproval = async (
        userAddress: string,
        tokenSymbol: string,
        tokenAmount: number,
        approvalTxHash?: string
    ) => {
        try {
            setState({
                status: 'processing',
                step: 'Processing gasless payment after approval...',
                error: null
            });

            // Execute gasless payment after approval
            const gaslessResponse = await fetch('/api/gasless-approval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress,
                    tokenSymbol,
                    tokenAmount,
                    approvalTxHash
                })
            });

            if (!gaslessResponse.ok) {
                const errorData = await gaslessResponse.json();
                throw new Error(errorData.error || 'Gasless payment failed');
            }

            const gaslessData = await gaslessResponse.json();

            setState({
                status: 'success',
                step: 'Payment completed! Tokens received, facilitator paid gas fees!',
                error: null
            });

            return {
                txHash: gaslessData.txHash,
                purchaseData: gaslessData.data,
                transactions: gaslessData.data.transactions
            };

        } catch (error: any) {
            setState({
                status: 'error',
                step: '',
                error: error.message
            });
            throw error;
        }
    };

    const reset = () => {
        setState({
            status: 'idle',
            step: '',
            error: null
        });
    };

    return {
        ...state,
        processGaslessPayment,
        continueAfterPayment,
        processTrueGaslessPayment,
        continueAfterApproval,
        reset
    };
}