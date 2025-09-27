const { ethers } = require("hardhat");

async function main() {
  console.log("Initializing stable APY...");

  // Get deployed contract address
  const LENDING_POOL_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  // Get the contract
  const LendingPool = await ethers.getContractAt("LendingPoolIntegrated", LENDING_POOL_ADDRESS);

  console.log("Calling updateStableAPY...");
  
  // Call updateStableAPY to initialize the smoothed APY
  const tx = await LendingPool.updateStableAPY();
  await tx.wait();
  
  console.log("Transaction completed:", tx.hash);

  // Check the results
  const stableAPY = await LendingPool.getStableAPY();
  const minAPY = await LendingPool.getMinAPY();
  const maxAPY = await LendingPool.getMaxAPY();

  console.log("\n=== APY Status ===");
  console.log("Stable APY (ray):", stableAPY.toString());
  console.log("Min APY (basis points):", minAPY.toString());
  console.log("Max APY (basis points):", maxAPY.toString());
  
  // Convert to readable percentages
  const stableAPYPercent = (Number(stableAPY) / 1e27) * 100;
  const minAPYPercent = Number(minAPY) / 100;
  const maxAPYPercent = Number(maxAPY) / 100;
  
  console.log("\n=== Readable Percentages ===");
  console.log("Stable APY:", stableAPYPercent.toFixed(2), "%");
  console.log("Min APY:", minAPYPercent.toFixed(2), "%");
  console.log("Max APY:", maxAPYPercent.toFixed(2), "%");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });