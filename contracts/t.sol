// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev ERC20 Token with controlled distribution:
 * - Total Supply: 1,000,000 tokens
 * - 5% Airdrop (50,000)
 * - 5% BAYC Community (50,000)
 * - 20% Liquidity (200,000)
 * - 70% Public Mint (700,000)
 */
contract MyToken is ERC20, Ownable {
    // ============ Constants ============
    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant AIRDROP_ALLOCATION = 50_000 * 1e18;      // 5%
    uint256 public constant BAYC_ALLOCATION = 50_000 * 1e18;         // 5%
    uint256 public constant LIQUIDITY_ALLOCATION = 200_000 * 1e18;   // 20%
    uint256 public constant MINT_ALLOCATION = 700_000 * 1e18;        // 70%

    // ============ State Variables ============
    uint256 public airdropMinted;
    uint256 public baycMinted;
    uint256 public liquidityMinted;
    uint256 public publicMinted;

    bool public mintingEnabled = true;

    // ============ Events ============
    event AirdropMinted(address indexed to, uint256 amount);
    event BaycMinted(address indexed to, uint256 amount);
    event LiquidityMinted(address indexed to, uint256 amount);
    event PublicMinted(address indexed to, uint256 amount);
    event MintingDisabled();

    // ============ Constructor ============
    constructor() ERC20("MyToken", "MTK") Ownable(msg.sender) {
        // Owner dapat langsung mint untuk liquidity dan alokasi awal
    }

    // ============ Mint Functions ============

    /**
     * @dev Mint for airdrop campaign (5% allocation)
     * @param to Recipient address
     * @param amount Amount in wei (with 18 decimals)
     */
    function mintAirdrop(address to, uint256 amount) external onlyOwner {
        require(mintingEnabled, "Minting disabled");
        require(amount > 0, "Amount must be > 0");
        require(airdropMinted + amount <= AIRDROP_ALLOCATION, "Exceeds airdrop allocation");
        
        airdropMinted += amount;
        _mint(to, amount);
        
        emit AirdropMinted(to, amount);
    }

    /**
     * @dev Mint for BAYC community/holders (5% allocation)
     * @param to Recipient address
     * @param amount Amount in wei (with 18 decimals)
     */
    function mintBayc(address to, uint256 amount) external onlyOwner {
        require(mintingEnabled, "Minting disabled");
        require(amount > 0, "Amount must be > 0");
        require(baycMinted + amount <= BAYC_ALLOCATION, "Exceeds BAYC allocation");
        
        baycMinted += amount;
        _mint(to, amount);
        
        emit BaycMinted(to, amount);
    }

    /**
     * @dev Mint for liquidity pool (20% allocation)
     * @param to Recipient address (usually LP contract or owner)
     * @param amount Amount in wei (with 18 decimals)
     */
    function mintLiquidity(address to, uint256 amount) external onlyOwner {
        require(mintingEnabled, "Minting disabled");
        require(amount > 0, "Amount must be > 0");
        require(liquidityMinted + amount <= LIQUIDITY_ALLOCATION, "Exceeds liquidity allocation");
        
        liquidityMinted += amount;
        _mint(to, amount);
        
        emit LiquidityMinted(to, amount);
    }

    /**
     * @dev Mint for public sale (70% allocation)
     * @param to Recipient address
     * @param amount Amount in wei (with 18 decimals)
     * Max 10,000 tokens per transaction for safety
     */
    function mintPublic(address to, uint256 amount) external onlyOwner {
        require(mintingEnabled, "Minting disabled");
        require(amount >= 1 * 1e18, "Min 1 token");
        require(amount <= 10_000 * 1e18, "Max 10,000 tokens per mint");
        require(publicMinted + amount <= MINT_ALLOCATION, "Exceeds public mint allocation");
        
        publicMinted += amount;
        _mint(to, amount);
        
        emit PublicMinted(to, amount);
    }

    // ============ Admin Functions ============

    /**
     * @dev Permanently disable minting (one-way function)
     * Call this when all allocations are distributed
     */
    function disableMinting() external onlyOwner {
        mintingEnabled = false;
        emit MintingDisabled();
    }

    // ============ View Functions ============

    /**
     * @dev Get remaining allocations for each category
     */
    function getRemainingAllocations() external view returns (
        uint256 airdropRemaining,
        uint256 baycRemaining,
        uint256 liquidityRemaining,
        uint256 publicRemaining
    ) {
        airdropRemaining = AIRDROP_ALLOCATION - airdropMinted;
        baycRemaining = BAYC_ALLOCATION - baycMinted;
        liquidityRemaining = LIQUIDITY_ALLOCATION - liquidityMinted;
        publicRemaining = MINT_ALLOCATION - publicMinted;
    }

    /**
     * @dev Get current distribution status
     */
    function getDistributionStatus() external view returns (
        uint256 totalMinted_,
        uint256 airdropProgress,
        uint256 baycProgress,
        uint256 liquidityProgress,
        uint256 publicProgress
    ) {
        totalMinted_ = totalSupply();
        airdropProgress = (airdropMinted * 100) / AIRDROP_ALLOCATION;
        baycProgress = (baycMinted * 100) / BAYC_ALLOCATION;
        liquidityProgress = (liquidityMinted * 100) / LIQUIDITY_ALLOCATION;
        publicProgress = (publicMinted * 100) / MINT_ALLOCATION;
    }
}