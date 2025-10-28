// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10000 * 1e18; // 10.000 token (18 decimals)

    constructor() ERC20("MyToken", "MTK") {}

    /// @dev Hanya owner (backend Anda) yang bisa mint
    function mint(address to, uint256 amount) external onlyOwner {
        require(amount >= 1e18, "Min 1 token");
        require(amount <= 100 * 1e18, "Max 100 tokens");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds total supply");

        _mint(to, amount);
    }
}