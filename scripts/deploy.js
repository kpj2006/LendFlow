const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  console.log("MockUSDC deployed to:", await mockUSDC.getAddress());

  // Deploy MockCETH (Collateral token)
  const MockCETH = await ethers.getContractFactory("MockCETH");
  const mockCETH = await MockCETH.deploy();
  await mockCETH.waitForDeployment();
  console.log("MockCETH deployed to:", await mockCETH.getAddress());

  // Deploy MockMakerPot
  const MockMakerPot = await ethers.getContractFactory("MockMakerPot");
  const mockMakerPot = await MockMakerPot.deploy();
  await mockMakerPot.waitForDeployment();
  console.log("MockMakerPot deployed to:", await mockMakerPot.getAddress());

  // Deploy MockAaveV3Pool
  const MockAaveV3Pool = await ethers.getContractFactory("MockAaveV3Pool");
  const mockAavePool = await MockAaveV3Pool.deploy();
  await mockAavePool.waitForDeployment();
  console.log("MockAaveV3Pool deployed to:", await mockAavePool.getAddress());

  // For demo purposes, we'll use mock addresses for Rootstock
  // In production, these would be real contract addresses
  const mockRootstockBridge = ethers.ZeroAddress;

  // Deploy LendingPool
  const LendingPool = await ethers.getContractFactory("LendingPoolIntegrated");
  const lendingPool = await LendingPool.deploy(
    await mockUSDC.getAddress(),
    await mockCETH.getAddress(),
    mockRootstockBridge,
    await mockMakerPot.getAddress(),
    await mockAavePool.getAddress()
  );
  await lendingPool.waitForDeployment();
  console.log("LendingPool deployed to:", await lendingPool.getAddress());

  // Mint some USDC to deployer for testing
  const [deployer] = await ethers.getSigners();
  console.log("Additional USDC minted to deployer");

  // Mint some cETH to deployer for testing  
  console.log("Additional cETH minted to deployer");

  console.log("\n=== Deployment Summary ===");
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("MockCETH:", await mockCETH.getAddress());
  console.log("MockMakerPot:", await mockMakerPot.getAddress());
  console.log("MockAaveV3Pool:", await mockAavePool.getAddress());
  console.log("LendingPool:", await lendingPool.getAddress());
  console.log("Owner Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  console.log("Deployer:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
