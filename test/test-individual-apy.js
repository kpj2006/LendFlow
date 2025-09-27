const hre = require("hardhat");

async function main() {
    console.log("Testing Individual Protocol APYs...");
    
    // Get deployed contract addresses
    const MAKER_POT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const AAVE_POOL_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    const USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    try {
        console.log("\n1. Testing MakerDAO DSR...");
        const makerPot = await hre.ethers.getContractAt("MockMakerPot", MAKER_POT_ADDRESS);
        const dsr = await makerPot.dsr();
        console.log(`DSR: ${dsr.toString()}`);
        console.log(`DSR in percentage: ${hre.ethers.utils.formatUnits(dsr, 27) * 100}%`);
        
        console.log("\n2. Testing Aave APY...");
        const aavePool = await hre.ethers.getContractAt("MockAaveV3Pool", AAVE_POOL_ADDRESS);
        const reserveData = await aavePool.getReserveData(USDC_ADDRESS);
        const aaveAPY = reserveData[2]; // currentLiquidityRate
        console.log(`Aave APY: ${aaveAPY.toString()}`);
        console.log(`Aave APY in percentage: ${hre.ethers.utils.formatUnits(aaveAPY, 27) * 100}%`);
        
        console.log("\n3. Manual Weighted Calculation:");
        const makerPercent = parseFloat(hre.ethers.utils.formatUnits(dsr, 27)) * 100;
        const aavePercent = parseFloat(hre.ethers.utils.formatUnits(aaveAPY, 27)) * 100;
        const weightedAPY = 0.7 * makerPercent + 0.3 * aavePercent;
        console.log(`Expected Weighted APY: ${weightedAPY.toFixed(4)}%`);
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });