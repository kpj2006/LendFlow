const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingPoolIntegrated", function () {
  let lendingPool;
  let mockUSDC;
  let mockPythOracle;
  let owner;
  let lender1;
  let lender2;
  let borrower1;
  let borrower2;

  beforeEach(async function () {
    [owner, lender1, lender2, borrower1, borrower2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy MockPythOracle
    const MockPythOracle = await ethers.getContractFactory("MockPythOracle");
    mockPythOracle = await MockPythOracle.deploy();
    await mockPythOracle.waitForDeployment();

    // Deploy mock Walrus contracts (simplified for testing)
    const MockWalrusStorage = await ethers.getContractFactory("MockUSDC"); // Using MockUSDC as placeholder
    const mockWalrusStorage = await MockWalrusStorage.deploy();
    await mockWalrusStorage.waitForDeployment();

    const MockWalrusToken = await ethers.getContractFactory("MockUSDC"); // Using MockUSDC as placeholder
    const mockWalrusToken = await MockWalrusToken.deploy();
    await mockWalrusToken.waitForDeployment();

    const MockRootstockBridge = await ethers.getContractFactory("MockUSDC"); // Using MockUSDC as placeholder
    const mockRootstockBridge = await MockRootstockBridge.deploy();
    await mockRootstockBridge.waitForDeployment();

    // Deploy LendingPoolIntegrated
    const LendingPoolIntegrated = await ethers.getContractFactory("LendingPoolIntegrated");
    lendingPool = await LendingPoolIntegrated.deploy(
      await mockUSDC.getAddress(),
      await mockPythOracle.getAddress(),
      await mockWalrusStorage.getAddress(),
      await mockWalrusToken.getAddress(),
      await mockRootstockBridge.getAddress()
    );
    await lendingPool.waitForDeployment();

    // Mint USDC to test accounts
    await mockUSDC.mint(lender1.address, ethers.parseUnits("10000", 6));
    await mockUSDC.mint(lender2.address, ethers.parseUnits("10000", 6));
    await mockUSDC.mint(borrower1.address, ethers.parseUnits("1000", 6));
    await mockUSDC.mint(borrower2.address, ethers.parseUnits("1000", 6));
  });

  describe("Liquidity Management", function () {
    it("Should allow lenders to add liquidity", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const apy = 360; // 3.6%

      await mockUSDC.connect(lender1).approve(await lendingPool.getAddress(), amount);
      await lendingPool.connect(lender1).addLiquidity(amount, apy);

      const lenderInfo = await lendingPool.lenders(lender1.address);
      expect(lenderInfo.amount).to.equal(amount);
      expect(lenderInfo.fixedAPY).to.equal(apy);
      expect(lenderInfo.active).to.be.true;
    });

    it("Should update total pool liquidity", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const apy = 360;

      await mockUSDC.connect(lender1).approve(await lendingPool.getAddress(), amount);
      await lendingPool.connect(lender1).addLiquidity(amount, apy);

      const poolStatus = await lendingPool.getPoolStatus();
      expect(poolStatus[0]).to.equal(amount); // totalLiquidity
    });
  });

  describe("Small Borrower Matching", function () {
    beforeEach(async function () {
      // Add liquidity from two lenders
      const amount1 = ethers.parseUnits("50", 6);
      const amount2 = ethers.parseUnits("50", 6);
      const apy1 = 360; // 3.6%
      const apy2 = 400; // 4.0%

      await mockUSDC.connect(lender1).approve(await lendingPool.getAddress(), amount1);
      await mockUSDC.connect(lender2).approve(await lendingPool.getAddress(), amount2);
      
      await lendingPool.connect(lender1).addLiquidity(amount1, apy1);
      await lendingPool.connect(lender2).addLiquidity(amount2, apy2);
    });

    it("Should match small borrower with lowest APY first", async function () {
      const loanAmount = ethers.parseUnits("30", 6);

      await lendingPool.connect(borrower1).requestLoan(loanAmount);

      const borrowerInfo = await lendingPool.borrowers(borrower1.address);
      expect(borrowerInfo.amount).to.equal(loanAmount);
      expect(borrowerInfo.active).to.be.true;

      // Check that lender1 (lower APY) was used first
      const lender1Info = await lendingPool.lenders(lender1.address);
      expect(lender1Info.amount).to.equal(ethers.parseUnits("20", 6)); // 50 - 30
    });
  });

  describe("Whale Borrower Matching", function () {
    beforeEach(async function () {
      // Add liquidity from two lenders
      const amount1 = ethers.parseUnits("50", 6);
      const amount2 = ethers.parseUnits("50", 6);
      const apy1 = 360; // 3.6%
      const apy2 = 400; // 4.0%

      await mockUSDC.connect(lender1).approve(await lendingPool.getAddress(), amount1);
      await mockUSDC.connect(lender2).approve(await lendingPool.getAddress(), amount2);
      
      await lendingPool.connect(lender1).addLiquidity(amount1, apy1);
      await lendingPool.connect(lender2).addLiquidity(amount2, apy2);
    });

    it("Should match whale borrower with highest APY first", async function () {
      const loanAmount = ethers.parseUnits("70", 6); // Above whale threshold

      await lendingPool.connect(borrower1).requestLoan(loanAmount);

      const borrowerInfo = await lendingPool.borrowers(borrower1.address);
      expect(borrowerInfo.amount).to.equal(loanAmount);
      expect(borrowerInfo.active).to.be.true;

      // Check that lender2 (higher APY) was used first
      const lender2Info = await lendingPool.lenders(lender2.address);
      expect(lender2Info.amount).to.equal(0); // 50 - 50 = 0

      const lender1Info = await lendingPool.lenders(lender1.address);
      expect(lender1Info.amount).to.equal(ethers.parseUnits("30", 6)); // 50 - 20
    });
  });

  describe("APY Calculations", function () {
    it("Should calculate weighted APY correctly", async function () {
      // Add liquidity
      const amount1 = ethers.parseUnits("50", 6);
      const amount2 = ethers.parseUnits("50", 6);
      const apy1 = 360; // 3.6%
      const apy2 = 400; // 4.0%

      await mockUSDC.connect(lender1).approve(await lendingPool.getAddress(), amount1);
      await mockUSDC.connect(lender2).approve(await lendingPool.getAddress(), amount2);
      
      await lendingPool.connect(lender1).addLiquidity(amount1, apy1);
      await lendingPool.connect(lender2).addLiquidity(amount2, apy2);

      // Whale borrower takes from both
      const loanAmount = ethers.parseUnits("70", 6);
      await lendingPool.connect(borrower1).requestLoan(loanAmount);

      const borrowerInfo = await lendingPool.borrowers(borrower1.address);
      
      // Expected weighted APY: (50*400 + 20*360) / 70 = 380
      expect(borrowerInfo.weightedAPY).to.be.closeTo(380, 10);
    });
  });

  describe("Pyth Integration", function () {
    it("Should get Pyth APY reference", async function () {
      const pythAPY = await lendingPool.getPythAPY();
      expect(pythAPY).to.be.gt(0);
    });
  });

  describe("Error Handling", function () {
    it("Should reject loan requests exceeding pool liquidity", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const apy = 360;

      await mockUSDC.connect(lender1).approve(await lendingPool.getAddress(), amount);
      await lendingPool.connect(lender1).addLiquidity(amount, apy);

      const excessiveAmount = ethers.parseUnits("2000", 6);
      
      await expect(
        lendingPool.connect(borrower1).requestLoan(excessiveAmount)
      ).to.be.revertedWith("Insufficient pool liquidity");
    });

    it("Should reject invalid APY values", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const invalidAPY = 5001; // > 50%

      await mockUSDC.connect(lender1).approve(await lendingPool.getAddress(), amount);
      
      await expect(
        lendingPool.connect(lender1).addLiquidity(amount, invalidAPY)
      ).to.be.revertedWith("APY must be between 0.01% and 50%");
    });
  });
});
