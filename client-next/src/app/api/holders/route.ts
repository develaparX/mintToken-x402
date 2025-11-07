import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// BSCScan API untuk mendapatkan token holders
async function getHoldersFromBSCScan(contractAddress: string) {
  const apiKey = process.env.BSCSCAN_API_KEY;

  if (!apiKey) {
    throw new Error("BSCScan API key not configured");
  }

  const response = await fetch(
    `https://api.etherscan.com/v2/api?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=1000&apikey=${apiKey}`,
    {
      next: { revalidate: 300 }, // Cache for 5 minutes
    },
  );

  if (!response.ok) {
    throw new Error(`BSCScan API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "1") {
    throw new Error(data.message || "BSCScan API returned error");
  }

  return data.result;
}

// Fallback: Get holders from contract events
async function getHoldersFromEvents(contractAddress: string) {
  const rpcUrl = process.env.BSC_RPC_URL || process.env.NEXT_PUBLIC_BSC_RPC_URL;

  if (!rpcUrl) {
    throw new Error("BSC RPC URL not configured");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Basic ERC20 ABI for Transfer events
  const abi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function balanceOf(address account) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
  ];

  const contract = new ethers.Contract(contractAddress, abi, provider);

  try {
    // Get Transfer events (last 10000 blocks to avoid timeout)
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000);

    const transferEvents = await contract.queryFilter(
      contract.filters.Transfer(),
      fromBlock,
      "latest",
    );

    // Build unique holder addresses
    const holderAddresses = new Set<string>();

    transferEvents.forEach((event: any) => {
      const { to } = event.args;
      if (to !== ethers.ZeroAddress) {
        holderAddresses.add(to);
      }
    });

    // Get balances for each holder
    const holders = [];
    const totalSupply = await contract.totalSupply();

    for (const address of holderAddresses) {
      try {
        const balance = await contract.balanceOf(address);
        if (balance > 0) {
          holders.push({
            TokenHolderAddress: address,
            TokenHolderQuantity: balance.toString(),
          });
        }
      } catch (error) {
        console.warn(`Failed to get balance for ${address}:`, error);
      }
    }

    return { holders, totalSupply: totalSupply.toString() };
  } catch (error) {
    console.error("Error fetching from events:", error);
    throw new Error("Failed to fetch holders from blockchain events");
  }
}

export async function GET(request: NextRequest) {
  try {
    const contractAddress =
      process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!contractAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Contract address not configured",
        },
        { status: 500 },
      );
    }

    let holders;
    let totalSupply = "0";

    try {
      // Try BSCScan API first (more reliable and complete)
      console.log("Fetching holders from BSCScan API...");
      holders = await getHoldersFromBSCScan(contractAddress);

      // Get total supply from RPC
      const rpcUrl =
        process.env.BSC_RPC_URL || process.env.NEXT_PUBLIC_BSC_RPC_URL;
      if (rpcUrl) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(
          contractAddress,
          ["function totalSupply() view returns (uint256)"],
          provider,
        );
        totalSupply = (await contract.totalSupply()).toString();
      }
    } catch (bscscanError) {
      console.warn(
        "BSCScan API failed, trying blockchain events:",
        bscscanError,
      );

      // Fallback to events
      const eventData = await getHoldersFromEvents(contractAddress);
      holders = eventData.holders;
      totalSupply = eventData.totalSupply;
    }

    // Filter out zero balances and sort by balance
    const validHolders = holders.filter(
      (holder: any) =>
        holder.TokenHolderQuantity &&
        ethers.getBigInt(holder.TokenHolderQuantity) > 0,
    );

    // Sort by balance (highest first)
    validHolders.sort((a: any, b: any) => {
      const balanceA = ethers.getBigInt(a.TokenHolderQuantity);
      const balanceB = ethers.getBigInt(b.TokenHolderQuantity);
      return balanceA > balanceB ? -1 : balanceA < balanceB ? 1 : 0;
    });

    return NextResponse.json({
      success: true,
      holders: validHolders,
      totalHolders: validHolders.length,
      totalSupply,
      contractAddress,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in holders API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch token holders",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Optional: Add POST method for manual refresh
export async function POST(request: NextRequest) {
  // Same logic as GET but force refresh (no cache)
  return GET(request);
}
