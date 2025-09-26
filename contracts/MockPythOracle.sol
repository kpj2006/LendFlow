// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockPythOracle {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }
    
    mapping(bytes32 => Price) public prices;
    
    constructor() {
        // Set initial USDC/USD price (simulating 1 USDC = 1 USD)
        bytes32 usdcPriceId = 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a;
        prices[usdcPriceId] = Price({
            price: 1000000, // 1.000000 USD (6 decimals)
            conf: 100,      // 0.0001 confidence
            expo: -6,       // -6 exponent
            publishTime: block.timestamp
        });
    }
    
    function getPrice(bytes32 priceId) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime) {
        Price memory priceData = prices[priceId];
        return (priceData.price, priceData.conf, priceData.expo, priceData.publishTime);
    }
    
    function updatePrice(bytes32 priceId, int64 newPrice) external {
        prices[priceId].price = newPrice;
        prices[priceId].publishTime = block.timestamp;
    }
    
    // Function to simulate APY changes based on market conditions
    function getAPYReference() external view returns (uint256) {
        // Simulate APY between 3.6% and 4.0% based on current price
        bytes32 usdcPriceId = 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a;
        Price memory priceData = prices[usdcPriceId];
        
        // Simple APY calculation based on price volatility
        uint256 baseAPY = 360; // 3.6% in basis points
        uint256 volatility = uint256(uint64(priceData.conf)) / 10; // Convert confidence to APY adjustment
        return baseAPY + volatility;
    }
}
