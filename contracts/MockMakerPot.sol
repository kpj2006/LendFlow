// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockMakerPot {
    // Hardcoded DSR representing 5% APY directly in ray format (1e27)
    // 5% = 0.05 * 1e27 = 50000000000000000000000000
    uint256 public constant dsr = 50000000000000000000000000; // 5% APY annualized
    uint256 public chi = 1000000000000000000000000000; // 1.0 in ray
    uint256 public rho = block.timestamp;

    function drip() external {
        // For testing purposes, keep chi constant with hardcoded DSR
        rho = block.timestamp;
    }

    function setDSR(uint256 _dsr) external {
        // Allow manual override for testing, but default is hardcoded
        // This function kept for compatibility but not used in production
    }
}