import { ethers } from 'ethers';

// Normalize address with proper checksum
export function normalizeAddress(address: string): string {
    try {
        if (!address || address.length !== 42) {
            throw new Error('Invalid address length');
        }

        // Use ethers.getAddress to get proper checksum
        return ethers.getAddress(address.toLowerCase());
    } catch (error) {
        console.error('Address normalization failed:', error);
        throw new Error(`Invalid address format: ${address}`);
    }
}

// Validate if string is a valid Ethereum address
export function isValidAddress(address: string): boolean {
    try {
        ethers.getAddress(address);
        return true;
    } catch {
        return false;
    }
}

// Simple contract validation
export async function validateContract(contractAddress: string, rpcUrl: string): Promise<boolean> {
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Check if address has code (is a contract)
        const code = await provider.getCode(contractAddress);

        if (code === '0x') {
            console.error('Contract address has no code - not a valid contract');
            return false;
        }

        console.log('Contract validation successful - code length:', code.length);
        return true;
    } catch (error) {
        console.error('Contract validation failed:', error);
        return false;
    }
}

// Test contract functions
export async function testContractFunctions(contractAddress: string, rpcUrl: string): Promise<void> {
    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Test with minimal ABI first
        const minimalABI = [
            "function totalSupply() external view returns (uint256)",
            "function name() external view returns (string)",
            "function symbol() external view returns (string)"
        ];

        const contract = new ethers.Contract(contractAddress, minimalABI, provider);

        console.log('Testing basic ERC20 functions...');

        try {
            const totalSupply = await contract.totalSupply();
            console.log('Total Supply:', ethers.formatEther(totalSupply));
        } catch (e) {
            console.log('totalSupply() not available or different signature');
        }

        try {
            const name = await contract.name();
            console.log('Token Name:', name);
        } catch (e) {
            console.log('name() not available');
        }

        try {
            const symbol = await contract.symbol();
            console.log('Token Symbol:', symbol);
        } catch (e) {
            console.log('symbol() not available');
        }

    } catch (error) {
        console.error('Contract function test failed:', error);
    }
}