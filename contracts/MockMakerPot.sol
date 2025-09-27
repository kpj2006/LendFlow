// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockMakerPot {
    // Hardcoded DSR representing ~5% APY in ray format (1e27)
    uint256 public constant dsr = 1000000001547125957863212448; // ~5% APY
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