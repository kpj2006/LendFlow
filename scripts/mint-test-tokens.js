const { ethers } = require("hardhat");

async function main() {
  console.log("Minting test tokens to accounts...");

  // Get deployed contract addresses
  const USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const CETH_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Get the contracts
  const MockUSDC = await ethers.getContractAt("MockUSDC", USDC_ADDRESS);
  const MockCETH = await ethers.getContractAt("MockCETH", CETH_ADDRESS);

  // Get test accounts
  const signers = await ethers.getSigners();
  const testAccounts = signers.slice(1, 6); // Use accounts 1-5 for testing

  console.log("Minting tokens to test accounts:");

  for (let i = 0; i < testAccounts.length; i++) {
    const account = testAccounts[i];
    
    // Mint 10,000 USDC (6 decimals)
    const usdcAmount = ethers.parseUnits("10000", 6);
    await MockUSDC.mint(account.address, usdcAmount);
    
    // Mint 10 CETH (18 decimals)  
    const cethAmount = ethers.parseUnits("10", 18);
    await MockCETH.mint(account.address, cethAmount);
    
    console.log(`Account ${i + 1} (${account.address}): 10,000 USDC + 10 CETH`);
  }

  console.log("\nTest token minting completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });