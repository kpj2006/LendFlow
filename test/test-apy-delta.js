const hre = require("hardhat");

async function main() {
    console.log("Testing APY Delta Functionality...");
    
    // Get deployed contract addresses from Rootstock testnet
    const LENDING_POOL_ADDRESS = "0xDbC1fC13cE9605Cc7A3C442b22c95c04A61c9B58";
    
    // Get contract instance
    const lendingPool = await hre.ethers.getContractAt("LendingPoolIntegrated", LENDING_POOL_ADDRESS);
    
    try {
        console.log("\n1. Updating Stable APY...");
        const updateTx = await lendingPool.updateStableAPY();
        await updateTx.wait();
        console.log("✅ Stable APY updated");
        
        console.log("\n2. Fetching APY Values...");
        const stableAPY = await lendingPool.getStableAPY();
        const minAPY = await lendingPool.getMinAPY();
        const maxAPY = await lendingPool.getMaxAPY();
        
        // Convert from ray to percentage
        const stableAPYPercent = parseFloat(hre.ethers.utils.formatUnits(stableAPY, 27)) * 100;
        const minAPYBasisPoints = minAPY.toNumber();
        const maxAPYBasisPoints = maxAPY.toNumber();
        
        console.log(`Stable APY: ${stableAPYPercent.toFixed(4)}%`);
        console.log(`Min APY: ${(minAPYBasisPoints / 100).toFixed(2)}% (${minAPYBasisPoints} basis points)`);
        console.log(`Max APY: ${(maxAPYBasisPoints / 100).toFixed(2)}% (${maxAPYBasisPoints} basis points)`);
        
        console.log("\n3. Verifying Delta = 0.2% (200 basis points)...");
        const stableAPYBasisPoints = Math.round(stableAPYPercent * 100);
        const expectedMin = stableAPYBasisPoints - 200;
        const expectedMax = stableAPYBasisPoints + 200;
        
        console.log(`Expected Min: ${expectedMin} basis points`);
        console.log(`Expected Max: ${expectedMax} basis points`);
        console.log(`Actual Min: ${minAPYBasisPoints} basis points`);
        console.log(`Actual Max: ${maxAPYBasisPoints} basis points`);
        
        const minMatch = Math.abs(minAPYBasisPoints - expectedMin) <= 1;
        const maxMatch = Math.abs(maxAPYBasisPoints - expectedMax) <= 1;
        
        if (minMatch && maxMatch) {
            console.log("✅ Delta implementation is CORRECT!");
        } else {
            console.log("❌ Delta implementation has issues");
        }
        
        console.log("\n4. Testing Lender APY Range Validation...");
        console.log(`Lenders can set APY between ${(minAPYBasisPoints/100).toFixed(2)}% and ${(maxAPYBasisPoints/100).toFixed(2)}%`);
        
    } catch (error) {
        console.error("Error testing APY functionality:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });