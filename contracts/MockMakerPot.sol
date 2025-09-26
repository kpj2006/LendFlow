// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockMakerPot {
    uint256 public dsr = 1000000003022265980097387650; // ~3% APY in ray (1e27)
    uint256 public chi = 1000000000000000000000000000; // 1.0 in ray
    uint256 public rho = block.timestamp;

    function drip() external {
        // Simulate interest accrual
        uint256 timeElapsed = block.timestamp - rho;
        if (timeElapsed > 0) {
            // chi = chi * (dsr ^ timeElapsed)
            // For simplicity, just add some interest
            chi = chi + (chi * timeElapsed / 365 days / 100); // ~1% annual
        }
        rho = block.timestamp;
    }

    function setDSR(uint256 _dsr) external {
        dsr = _dsr;
    }
}