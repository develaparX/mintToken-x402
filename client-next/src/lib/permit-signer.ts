import { ethers } from 'ethers';

// Type for ethereum provider
interface EthereumProvider {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    isMetaMask?: boolean;
}

// EIP-2612 Permit Type Data
const PERMIT_TYPEHASH = ethers.keccak256(
    ethers.toUtf8Bytes("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")
);

export interface PermitData {
    owner: string;
    spender: string;
    value: string;
    nonce: string;
    deadline: string;
    domainSeparator: string;
    tokenName: string;
    tokenAddress: string;
    chainId: number;
}

export interface PermitSignature {
    owner: string;
    spender: string;
    value: string;
    deadline: string;
    v: number;
    r: string;
    s: string;
}

export class PermitSigner {
    /**
     * Sign EIP-2612 permit for gasless USDT transfer
     */
    static async signPermit(permitData: PermitData): Promise<PermitSignature> {
        try {
            // Check if window.ethereum is available
            const ethereum = (window as any).ethereum as EthereumProvider;
            if (!ethereum) {
                throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
            }

            // Request account access
            await ethereum.request({ method: 'eth_requestAccounts' });

            // Create provider and signer
            const provider = new ethers.BrowserProvider(ethereum as any);
            const signer = await provider.getSigner();

            // Verify user address matches
            const userAddress = await signer.getAddress();
            if (userAddress.toLowerCase() !== permitData.owner.toLowerCase()) {
                throw new Error(`Please switch to account ${permitData.owner}`);
            }

            // Create domain data
            const domain = {
                name: permitData.tokenName,
                version: '1',
                chainId: permitData.chainId,
                verifyingContract: permitData.tokenAddress
            };

            // Create types
            const types = {
                Permit: [
                    { name: 'owner', type: 'address' },
                    { name: 'spender', type: 'address' },
                    { name: 'value', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            };

            // Create message
            const message = {
                owner: permitData.owner,
                spender: permitData.spender,
                value: permitData.value,
                nonce: permitData.nonce,
                deadline: permitData.deadline
            };

            console.log('Signing permit with data:', { domain, types, message });

            // Sign the permit
            const signature = await signer.signTypedData(domain, types, message);

            // Split signature
            const sig = ethers.Signature.from(signature);

            return {
                owner: permitData.owner,
                spender: permitData.spender,
                value: permitData.value,
                deadline: permitData.deadline,
                v: sig.v,
                r: sig.r,
                s: sig.s
            };

        } catch (error: any) {
            console.error('Permit signing error:', error);

            if (error.code === 4001) {
                throw new Error('User rejected the signing request');
            }

            if (error.code === -32602) {
                throw new Error('Invalid parameters for permit signing');
            }

            throw new Error(error.message || 'Failed to sign permit');
        }
    }

    /**
     * Verify permit signature (optional, for debugging)
     */
    static verifyPermitSignature(permitData: PermitData, signature: PermitSignature): boolean {
        try {
            // Create domain hash
            const domainHash = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
                    [
                        ethers.keccak256(ethers.toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")),
                        ethers.keccak256(ethers.toUtf8Bytes(permitData.tokenName)),
                        ethers.keccak256(ethers.toUtf8Bytes("1")),
                        permitData.chainId,
                        permitData.tokenAddress
                    ]
                )
            );

            // Create struct hash
            const structHash = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
                    [
                        PERMIT_TYPEHASH,
                        signature.owner,
                        signature.spender,
                        signature.value,
                        permitData.nonce,
                        signature.deadline
                    ]
                )
            );

            // Create digest
            const digest = ethers.keccak256(
                ethers.concat([
                    ethers.toUtf8Bytes('\x19\x01'),
                    domainHash,
                    structHash
                ])
            );

            // Recover signer
            const recoveredAddress = ethers.recoverAddress(digest, {
                r: signature.r,
                s: signature.s,
                v: signature.v
            });

            return recoveredAddress.toLowerCase() === permitData.owner.toLowerCase();

        } catch (error) {
            console.error('Permit verification error:', error);
            return false;
        }
    }
}

// Helper function to check if browser supports Web3
export function isWeb3Available(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
}

// Helper function to get user's current address
export async function getCurrentAddress(): Promise<string | null> {
    try {
        const ethereum = (window as any).ethereum as EthereumProvider;
        if (!ethereum) return null;

        const provider = new ethers.BrowserProvider(ethereum as any);
        const signer = await provider.getSigner();
        return await signer.getAddress();
    } catch (error) {
        console.error('Error getting current address:', error);
        return null;
    }
}