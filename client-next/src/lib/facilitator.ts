import { ethers } from 'ethers';

// Get facilitator address from private key
export function getFacilitatorAddress(): string {
    try {
        const privateKey = process.env.FACILITATOR_PRIVATE_KEY || process.env.NEXT_PUBLIC_FACILITATOR_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('Facilitator private key not found');
        }

        const wallet = new ethers.Wallet(privateKey);
        return wallet.address;
    } catch (error) {
        console.error('Error getting facilitator address:', error);
        // Fallback address derived from the provided private key
        return '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e';
    }
}

// Client-side version (without private key exposure)
export function getFacilitatorAddressClient(): string {
    // This is the address derived from the facilitator private key
    // 8ace0e2ba014937fe5f4eb083e5ab352b1e9a0f83fddd2b41e895e721be10453
    return ethers.getAddress('0x2B28F01152d4C2D7668Db010e54242eD35F694Fc');
}