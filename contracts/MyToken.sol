// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MyToken
 * @dev ERC20 Token with controlled distribution and payment handling:
 * - Total Supply: 1,000,000 tokens
 * - 5% Airdrop (50,000)
 * - 5% BAYC Community (50,000)
 * - 20% Liquidity (200,000)
 * - 70% Public Mint (700,000)
 * - Integrated USDT payment system
 */
contract MyToken is ERC20, Ownable, ReentrancyGuard {
    // ============ Constants ============
    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant AIRDROP_ALLOCATION = 50_000 * 1e18;      // 5%
    uint256 public constant BAYC_ALLOCATION = 50_000 * 1e18;         // 5%
    uint256 public constant LIQUIDITY_ALLOCATION = 200_000 * 1e18;   // 20%
    uint256 public constant MINT_ALLOCATION = 700_000 * 1e18;        // 70%

    // ============ Payment Configuration ============
    uint256 public tokenPrice = 5e16; // 0.05 USDT per token (1 USDT = 20 MTK)
    
    // Supported payment tokens (BSC addresses)
    mapping(address => bool) public acceptedTokens;
    mapping(address => uint8) public tokenDecimals;
    
    // BSC Mainnet token addresses
    address public constant USDT = 0x55d398326f99059fF775485246999027B3197955;
    address public constant USDC = 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d;

    // ============ State Variables ============
    uint256 public airdropMinted;
    uint256 public baycMinted;
    uint256 public liquidityMinted;
    uint256 public publicMinted;

    bool public mintingEnabled = true;
    bool public publicSaleEnabled = true;

    // Payment tracking
    mapping(address => uint256) public totalPaid;
    mapping(address => uint256) public totalPurchased;

    // ============ Events ============
    event AirdropMinted(address indexed to, uint256 amount);
    event BaycMinted(address indexed to, uint256 amount);
    event LiquidityMinted(address indexed to, uint256 amount);
    event PublicMinted(address indexed to, uint256 amount);
    event TokensPurchased(address indexed buyer, uint256 tokenAmount, address paymentToken, uint256 paymentAmount);
    event MintingDisabled();
    event PublicSaleDisabled();
    event PriceUpdated(uint256 newPrice);
    event PaymentTokenAdded(address token, uint8 decimals);
    event PaymentTokenRemoved(address token);

    // ============ Constructor ============
    constructor() ERC20("MyToken", "MTK") Ownable(msg.sender) {
        // Setup accepted payment tokens
        acceptedTokens[USDT] = true;
        acceptedTokens[USDC] = true;
        tokenDecimals[USDT] = 18;
        tokenDecimals[USDC] = 18;
    }

    // ============ Public Purchase Function ============
    
    /**
     * @dev Purchase tokens with USDT/USDC
     * @param tokenAmount Amount of MyTokens to purchase (in wei, 18 decimals)
     * @param paymentToken Address of payment token (USDT/USDC)
     */
    function purchaseTokens(uint256 tokenAmount, address paymentToken) external nonReentrant {
        require(mintingEnabled, "Minting disabled");
        require(publicSaleEnabled, "Public sale disabled");
        require(acceptedTokens[paymentToken], "Payment token not accepted");
        require(tokenAmount >= 1 * 1e18, "Min 1 token");
        require(tokenAmount <= 10_000 * 1e18, "Max 10,000 tokens per purchase");
        require(publicMinted + tokenAmount <= MINT_ALLOCATION, "Exceeds public mint allocation");

        // Calculate payment amount
        uint256 paymentAmount = (tokenAmount * tokenPrice) / 1e18;
        
        // Adjust for token decimals (USDT/USDC both have 18 decimals on BSC)
        uint8 paymentDecimals = tokenDecimals[paymentToken];
        if (paymentDecimals != 18) {
            paymentAmount = (paymentAmount * (10 ** paymentDecimals)) / 1e18;
        }

        // Transfer payment token from buyer to contract
        IERC20 paymentTokenContract = IERC20(paymentToken);
        require(
            paymentTokenContract.transferFrom(msg.sender, address(this), paymentAmount),
            "Payment transfer failed"
        );

        // Mint tokens to buyer
        publicMinted += tokenAmount;
        totalPaid[msg.sender] += paymentAmount;
        totalPurchased[msg.sender] += tokenAmount;
        
        _mint(msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, tokenAmount, paymentToken, paymentAmount);
        emit PublicMinted(msg.sender, tokenAmount);
    }

    /**
     * @dev Purchase tokens with gasless transaction (facilitator pays gas)
     * @param buyer Address that will receive the tokens
     * @param tokenAmount Amount of MyTokens to purchase
     * @param paymentToken Address of payment token
     * @param paymentAmount Amount of payment token (should match calculated price)
     */
    function purchaseTokensGasless(
        address buyer,
        uint256 tokenAmount,
        address paymentToken,
        uint256 paymentAmount
    ) external onlyOwner nonReentrant {
        require(mintingEnabled, "Minting disabled");
        require(publicSaleEnabled, "Public sale disabled");
        require(acceptedTokens[paymentToken], "Payment token not accepted");
        require(buyer != address(0), "Invalid buyer address");
        require(tokenAmount >= 1 * 1e18, "Min 1 token");
        require(tokenAmount <= 10_000 * 1e18, "Max 10,000 tokens per purchase");
        require(publicMinted + tokenAmount <= MINT_ALLOCATION, "Exceeds public mint allocation");

        // Verify payment amount matches expected price
        uint256 expectedPayment = (tokenAmount * tokenPrice) / 1e18;
        uint8 paymentDecimals = tokenDecimals[paymentToken];
        if (paymentDecimals != 18) {
            expectedPayment = (expectedPayment * (10 ** paymentDecimals)) / 1e18;
        }
        require(paymentAmount >= expectedPayment, "Insufficient payment amount");

        // For gasless transactions, we assume payment was already received by facilitator
        // This function is called after payment verification

        // Mint tokens to buyer
        publicMinted += tokenAmount;
        totalPaid[buyer] += paymentAmount;
        totalPurchased[buyer] += tokenAmount;
        
        _mint(buyer, tokenAmount);

        emit TokensPurchased(buyer, tokenAmount, paymentToken, paymentAmount);
        emit PublicMinted(buyer, tokenAmount);
    }

    // ============ Admin Mint Functions ============

    /**
     * @dev Mint for airdrop campaign (5% allocation)
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
     */
    function mintLiquidity(address to, uint256 amount) external onlyOwner {
        require(mintingEnabled, "Minting disabled");
        require(amount > 0, "Amount must be > 0");
        require(liquidityMinted + amount <= LIQUIDITY_ALLOCATION, "Exceeds liquidity allocation");
        
        liquidityMinted += amount;
        _mint(to, amount);
        
        emit LiquidityMinted(to, amount);
    }

    // ============ Admin Functions ============

    /**
     * @dev Update token price (in USDT wei, 18 decimals)
     */
    function setTokenPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be > 0");
        tokenPrice = newPrice;
        emit PriceUpdated(newPrice);
    }

    /**
     * @dev Add accepted payment token
     */
    function addPaymentToken(address token, uint8 decimals) external onlyOwner {
        require(token != address(0), "Invalid token address");
        acceptedTokens[token] = true;
        tokenDecimals[token] = decimals;
        emit PaymentTokenAdded(token, decimals);
    }

    /**
     * @dev Remove accepted payment token
     */
    function removePaymentToken(address token) external onlyOwner {
        acceptedTokens[token] = false;
        emit PaymentTokenRemoved(token);
    }

    /**
     * @dev Toggle public sale
     */
    function setPublicSaleEnabled(bool enabled) external onlyOwner {
        publicSaleEnabled = enabled;
        if (!enabled) {
            emit PublicSaleDisabled();
        }
    }

    /**
     * @dev Permanently disable minting
     */
    function disableMinting() external onlyOwner {
        mintingEnabled = false;
        emit MintingDisabled();
    }

    /**
     * @dev Withdraw collected payment tokens
     */
    function withdrawPayments(address token, uint256 amount) external onlyOwner {
        require(acceptedTokens[token] || token == USDT || token == USDC, "Invalid token");
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.transfer(owner(), amount), "Transfer failed");
    }

    /**
     * @dev Emergency withdraw all payment tokens
     */
    function emergencyWithdraw(address token) external onlyOwner {
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(tokenContract.transfer(owner(), balance), "Transfer failed");
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
        airdropProgress = AIRDROP_ALLOCATION > 0 ? (airdropMinted * 100) / AIRDROP_ALLOCATION : 0;
        baycProgress = BAYC_ALLOCATION > 0 ? (baycMinted * 100) / BAYC_ALLOCATION : 0;
        liquidityProgress = LIQUIDITY_ALLOCATION > 0 ? (liquidityMinted * 100) / LIQUIDITY_ALLOCATION : 0;
        publicProgress = MINT_ALLOCATION > 0 ? (publicMinted * 100) / MINT_ALLOCATION : 0;
    }

    /**
     * @dev Calculate payment amount for token purchase
     */
    function calculatePayment(uint256 tokenAmount, address paymentToken) external view returns (uint256) {
        require(acceptedTokens[paymentToken], "Payment token not accepted");
        
        uint256 paymentAmount = (tokenAmount * tokenPrice) / 1e18;
        
        uint8 paymentDecimals = tokenDecimals[paymentToken];
        if (paymentDecimals != 18) {
            paymentAmount = (paymentAmount * (10 ** paymentDecimals)) / 1e18;
        }
        
        return paymentAmount;
    }

    /**
     * @dev Get user purchase history
     */
    function getUserPurchaseInfo(address user) external view returns (
        uint256 totalTokensPurchased,
        uint256 totalAmountPaid
    ) {
        totalTokensPurchased = totalPurchased[user];
        totalAmountPaid = totalPaid[user];
    }

    /**
     * @dev Check if token is accepted for payment
     */
    function isPaymentTokenAccepted(address token) external view returns (bool) {
        return acceptedTokens[token];
    }
}