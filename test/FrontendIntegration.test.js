const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Frontend Integration Test", function () {
    let lendingPool, mockUSDC, mockCETH, mockMakerPot, mockAavePool;
    let owner, user1;

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        // Deploy contracts exactly like in deploy.js
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();

        const MockCETH = await ethers.getContractFactory("MockCETH");
        mockCETH = await MockCETH.deploy();

        const MockMakerPot = await ethers.getContractFactory("MockMakerPot");
        mockMakerPot = await MockMakerPot.deploy();

        const MockAaveV3Pool = await ethers.getContractFactory("MockAaveV3Pool");
        mockAavePool = await MockAaveV3Pool.deploy();

        const LendingPoolIntegrated = await ethers.getContractFactory("LendingPoolIntegrated");
        lendingPool = await LendingPoolIntegrated.deploy(
            await mockUSDC.getAddress(),
            await mockCETH.getAddress(),
            ethers.ZeroAddress, // rootstockBridge
            await mockMakerPot.getAddress(),
            await mockAavePool.getAddress()
        );

        // Initialize stable APY
        await lendingPool.updateStableAPY();
    });

    it("Should provide all data needed for LenderInterface", async function () {
        // Test stable APY
        const stableAPY = await lendingPool.getStableAPY();
        expect(stableAPY).to.be.gt(0);
        console.log("Stable APY:", ethers.formatUnits(stableAPY, 27));

        // Test dynamic bounds
        const minAPY = await lendingPool.getMinAPY();
        const maxAPY = await lendingPool.getMaxAPY();
        
        console.log("Min APY:", Number(minAPY), "basis points =", (Number(minAPY) / 100).toFixed(2) + "%");
        console.log("Max APY:", Number(maxAPY), "basis points =", (Number(maxAPY) / 100).toFixed(2) + "%");
        
        // Verify bounds are reasonable (4.35% - 4.75%)
        expect(Number(minAPY)).to.be.approximately(435, 5);
        expect(Number(maxAPY)).to.be.approximately(475, 5);
    });

    it("Should validate APY input like the frontend", async function () {
        await lendingPool.updateStableAPY();
        
        const minAPY = await lendingPool.getMinAPY();
        const maxAPY = await lendingPool.getMaxAPY();
        
        // Test frontend validation logic
        const testAPY = 4.5; // 4.5% APY
        const apyBasisPoints = testAPY * 100; // Convert to basis points
        
        const isValid = (apyBasisPoints >= Number(minAPY)) && (apyBasisPoints <= Number(maxAPY));
        console.log(`Testing APY: ${testAPY}% (${apyBasisPoints} BP) - Valid: ${isValid}`);
        
        expect(isValid).to.be.true;
    });

    it("Should test addLiquidity with valid APY", async function () {
        await lendingPool.updateStableAPY();
        
        // Mint some USDC to user1
        const usdcAmount = ethers.parseUnits("1000", 6); // 1000 USDC
        await mockUSDC.mint(user1.address, usdcAmount);
        
        // Approve spending
        await mockUSDC.connect(user1).approve(lendingPool.address, usdcAmount);
        
        const minAPY = await lendingPool.getMinAPY();
        const maxAPY = await lendingPool.getMaxAPY();
        
        // Test with valid APY (use average of min and max)
        const validAPY = (Number(minAPY) + Number(maxAPY)) / 2;
        console.log(`Testing addLiquidity with ${validAPY} basis points APY`);
        
        const lendAmount = ethers.parseUnits("100", 6); // 100 USDC
        
        await expect(
            lendingPool.connect(user1).addLiquidity(
                lendAmount,
                Math.floor(validAPY), // APY in basis points
                ethers.toUtf8Bytes("test metadata")
            )
        ).to.not.be.reverted;
    });
});