import { ethers } from 'ethers';
import { MINT_CONFIG } from '../config';

export const getRemainingSupply = async (): Promise<number> => {
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
    const abi = ['function totalSupply() view returns (uint256)'];
    const contract = new ethers.Contract(MINT_CONFIG.TOKEN_CONTRACT, abi, provider);
    const total = await contract.totalSupply();
    const used = Number(ethers.formatUnits(total, 18));
    return Math.max(0, MINT_CONFIG.TOTAL_SUPPLY - used);
};