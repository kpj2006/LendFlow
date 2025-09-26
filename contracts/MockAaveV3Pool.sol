// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockAaveV3Pool {
    // Mock reserve data for USDC
    uint256 public constant USDC_LIQUIDITY_RATE = 35000000000000000000000000; // ~3.5% APY in ray

    function getReserveData(address asset) external view returns (
        uint256 configuration,
        uint128 liquidityIndex,
        uint128 currentLiquidityRate,
        uint128 variableBorrowIndex,
        uint128 currentVariableBorrowRate,
        uint128 currentStableBorrowRate,
        uint40 lastUpdateTimestamp,
        uint16 id,
        address aTokenAddress,
        address stableDebtTokenAddress,
        address variableDebtTokenAddress,
        address interestRateStrategyAddress,
        uint128 accruedToTreasury,
        uint128 unbacked,
        uint128 isolationModeTotalDebt
    ) {
        // Return mock data - only currentLiquidityRate is used for APY
        return (
            0, // configuration
            1000000000000000000000000000, // liquidityIndex (1.0 in ray)
            uint128(USDC_LIQUIDITY_RATE), // currentLiquidityRate (~3.5% APY)
            1000000000000000000000000000, // variableBorrowIndex
            40000000000000000000000000, // currentVariableBorrowRate (~4%)
            40000000000000000000000000, // currentStableBorrowRate
            uint40(block.timestamp), // lastUpdateTimestamp
            1, // id
            address(0), // aTokenAddress
            address(0), // stableDebtTokenAddress
            address(0), // variableDebtTokenAddress
            address(0), // interestRateStrategyAddress
            0, // accruedToTreasury
            0, // unbacked
            0 // isolationModeTotalDebt
        );
    }

    function setLiquidityRate(uint256 _rate) external {
        // In a real implementation, this would update storage
        // For mock purposes, we just accept the call
    }
}