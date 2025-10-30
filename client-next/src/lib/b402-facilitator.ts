import { ethers } from 'ethers';

// MyToken Contract ABI for new contract with payment handling
const MYTOKEN_ABI = [
    "function purchaseTokensGasless(address buyer, uint256 tokenAmount, address paymentToken, uint256 paymentAmount) external",
    "function calculatePayment(uint256 tokenAmount, address paymentToken) external view returns (uint256)",
    "function isPaymentTokenAccepted(address token) external view returns (bool)",
    "function mintPublic(address to, uint256 amount) external",
    "function mintAirdrop(address to, uint256 amount) external",
    "function mintBayc(address to, uint256 amount) external",
    "function mintLiquidity(address to, uint256 amount) external",
    "function getRemainingAllocations() external view returns (uint256, uint256, uint256, uint256)",
    "function getDistributionStatus() external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function mintingEnabled() external view returns (bool)",
    "function publicSaleEnabled() external view returns (bool)",
    "function publicMinted() external view returns (uint256)",
    "function MINT_ALLOCATION() external view returns (uint256)",
    "function tokenPrice() external view returns (uint256)"
];

export class B402Facilitator {
    private provider: ethers.JsonRpcProvider;
    private facilitatorWallet: ethers.Wallet;
    private contractAddress: string;

    constructor(
        rpcUrl: string,
        facilitatorPrivateKey: string,
        contractAddress: string
    ) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.facilitatorWallet = new ethers.Wallet(facilitatorPrivateKey, this.provider);
        this.contractAddress = contractAddress;
    }

    async purchaseTokensGasless(
        buyerAddress: string,
        tokenAmount: number,
        paymentToken: string,
        paymentAmount: number
    ) {
        try {
            // Create contract instance with facilitator wallet
            const contract = new ethers.Contract(
                this.contractAddress,
                MYTOKEN_ABI,
                this.facilitatorWallet
            );

            // Check if minting and public sale are enabled
            const [mintingEnabled, publicSaleEnabled] = await Promise.all([
                contract.mintingEnabled(),
                contract.publicSaleEnabled()
            ]);

            if (!mintingEnabled) {
                throw new Error('Minting has been disabled');
            }

            if (!publicSaleEnabled) {
                throw new Error('Public sale has been disabled');
            }

            // Token addresses on BSC
            const tokenAddresses: { [key: string]: string } = {
                'USDT': '0x55d398326f99059fF775485246999027B3197955',
                'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                'USD1': '0x55d398326f99059fF775485246999027B3197955'
            };

            const paymentTokenAddress = tokenAddresses[paymentToken];
            if (!paymentTokenAddress) {
                throw new Error(`Unsupported payment token: ${paymentToken}`);
            }

            // Check if payment token is accepted
            const isAccepted = await contract.isPaymentTokenAccepted(paymentTokenAddress);
            if (!isAccepted) {
                throw new Error(`${paymentToken} is not accepted as payment`);
            }

            // Convert amounts to wei
            const tokenAmountWei = ethers.parseEther(tokenAmount.toString());
            const paymentAmountWei = ethers.parseEther(paymentAmount.toString());

            // Verify payment amount matches expected price
            const expectedPayment = await contract.calculatePayment(tokenAmountWei, paymentTokenAddress);
            if (paymentAmountWei < expectedPayment) {
                throw new Error(`Insufficient payment amount. Expected: ${ethers.formatEther(expectedPayment)}, Provided: ${paymentAmount}`);
            }

            // Check remaining public allocation
            const [, , , publicRemaining] = await contract.getRemainingAllocations();
            if (tokenAmountWei > publicRemaining) {
                throw new Error('Insufficient public allocation remaining');
            }

            // Execute gasless purchase (facilitator pays gas)
            const tx = await contract.purchaseTokensGasless(
                buyerAddress,
                tokenAmountWei,
                paymentTokenAddress,
                paymentAmountWei
            );

            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                tokenAmount,
                paymentAmount,
                paymentToken
            };
        } catch (error) {
            console.error('Gasless purchase failed:', error);
            throw error;
        }
    }

    // Legacy method for backward compatibility
    async mintTokensGasless(
        recipientAddress: string,
        amount: number,
        paymentProof: string
    ) {
        // For backward compatibility, assume USDT payment
        return this.purchaseTokensGasless(recipientAddress, amount, 'USDT', amount);
    }

    private async verifyPayment(paymentProof: string): Promise<boolean> {
        // Implement B402 payment verification logic
        // This would check against B402 payment gateway
        return true; // Simplified for example
    }
}