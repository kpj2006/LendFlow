const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  console.log("MockUSDC deployed to:", await mockUSDC.getAddress());

  // Deploy MockPythOracle
  const MockPythOracle = await ethers.getContractFactory("MockPythOracle");
  const mockPythOracle = await MockPythOracle.deploy();
  await mockPythOracle.waitForDeployment();
  console.log("MockPythOracle deployed to:", await mockPythOracle.getAddress());

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

  // For demo purposes, we'll use mock addresses for Walrus and Rootstock
  // In production, these would be real contract addresses
  const mockWalrusStorage = ethers.ZeroAddress; // Using zero address for demo
  const mockWalrusToken = ethers.ZeroAddress;
  const mockRootstockBridge = ethers.ZeroAddress;

  // Deploy LendingPool
  const LendingPool = await ethers.getContractFactory("LendingPoolIntegrated");
  const lendingPool = await LendingPool.deploy(
    await mockUSDC.getAddress(),
    await mockPythOracle.getAddress(),
    mockWalrusStorage,
    mockWalrusToken,
    mockRootstockBridge,
    await mockMakerPot.getAddress(),
    await mockAavePool.getAddress()
  );
  await lendingPool.waitForDeployment();
  console.log("LendingPool deployed to:", await lendingPool.getAddress());

  // Mint some USDC to deployer for testing
  const [deployer] = await ethers.getSigners();
  await mockUSDC.mint(deployer.address, ethers.parseUnits("10000", 6)); // 10k USDC
  console.log("Minted 10k USDC to deployer");

  console.log("\n=== Deployment Summary ===");
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("MockPythOracle:", await mockPythOracle.getAddress());
  console.log("MockMakerPot:", await mockMakerPot.getAddress());
  console.log("MockAaveV3Pool:", await mockAavePool.getAddress());
  console.log("LendingPool:", await lendingPool.getAddress());
  console.log("Deployer:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
