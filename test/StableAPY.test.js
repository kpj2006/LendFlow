const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Stable APY Calculation", function () {
    let lendingPool, mockUSDC, mockCETH, mockMakerPot, mockAavePool;
    let owner, user1;

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        // Deploy mock contracts
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDC.deploy();

        const MockCETH = await ethers.getContractFactory("MockCETH");
        mockCETH = await MockCETH.deploy();

        const MockMakerPot = await ethers.getContractFactory("MockMakerPot");
        mockMakerPot = await MockMakerPot.deploy();

        const MockAaveV3Pool = await ethers.getContractFactory("MockAaveV3Pool");
        mockAavePool = await MockAaveV3Pool.deploy();

        // Deploy LendingPool (use zero address for rootstockBridge in testing)
        const LendingPoolIntegrated = await ethers.getContractFactory("LendingPoolIntegrated");
        lendingPool = await LendingPoolIntegrated.deploy(
            await mockUSDC.getAddress(),
            await mockCETH.getAddress(),
            ethers.ZeroAddress, // rootstockBridge not needed for APY testing
            await mockMakerPot.getAddress(),
            await mockAavePool.getAddress()
        );
    });

    it("Should calculate correct stable APY: 0.7 * 5% + 0.3 * 3.5% = 4.55%", async function () {
        // Update stable APY
        await lendingPool.updateStableAPY();
        
        // Get the calculated APY
        const stableAPY = await lendingPool.getStableAPY();
        
        // Expected: 4.55% = 45500000000000000000000000 in ray format
        const expectedAPY = ethers.parseUnits("0.0455", 27); // 4.55% in ray
        
        console.log("Calculated Stable APY:", ethers.formatUnits(stableAPY, 27));
        console.log("Expected APY (4.55%):", ethers.formatUnits(expectedAPY, 27));
        
        // Allow for small rounding errors (within 0.01%)
        const tolerance = ethers.parseUnits("0.0001", 27); // 0.01% tolerance
        const difference = stableAPY > expectedAPY 
            ? stableAPY - expectedAPY 
            : expectedAPY - stableAPY;
            
        expect(difference).to.be.lt(tolerance);
    });

    it("Should implement delta 0.2% APY bounds correctly", async function () {
        // Update stable APY first
        await lendingPool.updateStableAPY();
        
        // Get APY bounds
        const minAPY = await lendingPool.getMinAPY();
        const maxAPY = await lendingPool.getMaxAPY();
        const stableAPY = await lendingPool.getStableAPY();
        
        // Convert to basis points for easier calculation
        const rayUnit = ethers.parseUnits("1", 27);
        const stableAPYBasisPoints = stableAPY * 10000n / rayUnit;
        
        console.log("Stable APY (basis points):", stableAPYBasisPoints.toString());
        console.log("Min APY (basis points):", minAPY.toString());
        console.log("Max APY (basis points):", maxAPY.toString());
        
        // Expected: stableAPY ± 20 basis points (0.2%)
        const expectedMin = stableAPYBasisPoints - 20n;
        const expectedMax = stableAPYBasisPoints + 20n;
        
        expect(minAPY).to.equal(expectedMin);
        expect(maxAPY).to.equal(expectedMax);
        
        // Test that values are approximately:
        // Min: 4.55% - 0.2% = 4.35% = 435 basis points
        // Max: 4.55% + 0.2% = 4.75% = 475 basis points
        expect(Number(minAPY)).to.be.closeTo(435, 5); // ±5 basis points tolerance
        expect(Number(maxAPY)).to.be.closeTo(475, 5); // ±5 basis points tolerance
    });

    it("Should verify individual protocol APYs", async function () {
        // Check MakerDAO DSR (should be 5%)
        const makerDSR = await mockMakerPot.dsr();
        const expectedMakerAPY = ethers.parseUnits("0.05", 27); // 5% in ray
        
        console.log("MakerDAO DSR:", ethers.formatUnits(makerDSR, 27));
        expect(makerDSR).to.equal(expectedMakerAPY);

        // Check Aave APY (should be 3.5%)
        const reserveData = await mockAavePool.getReserveData(await mockUSDC.getAddress());
        const aaveAPY = reserveData[2]; // currentLiquidityRate
        const expectedAaveAPY = ethers.parseUnits("0.035", 27); // 3.5% in ray
        
        console.log("Aave APY:", ethers.formatUnits(aaveAPY, 27));
        expect(aaveAPY).to.equal(expectedAaveAPY);
    });
});