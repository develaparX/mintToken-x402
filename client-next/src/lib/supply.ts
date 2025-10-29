import { MINT_CONFIG } from './config';

export async function getRemainingSupply(): Promise<number> {
    try {
        const response = await fetch('/api/mint/status');
        const data = await response.json();

        if (data.success) {
            const remaining = parseFloat(data.data.allocations.public.remaining);
            return Math.floor(remaining);
        }

        // Fallback jika API gagal
        return MINT_CONFIG.TOTAL_SUPPLY;
    } catch (error) {
        console.error('Failed to get remaining supply:', error);
        return MINT_CONFIG.TOTAL_SUPPLY;
    }
}