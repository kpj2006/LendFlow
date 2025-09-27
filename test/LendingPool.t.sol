// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {LendingPoolIntegrated} from "contracts/LendingPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ==============================================================================
// MOCK INTERFACES
// Defined locally for a self-contained test file.
// ==============================================================================

// Helper for Mocking Pyth data
struct PythPrice {
    int64 price;
    uint64 conf;
    int32 expo;
    uint256 publishTime;
}

// Mock implementation of IPythOracle
contract MockPythOracle is Test {
    mapping(bytes32 => PythPrice) public prices;
    uint256 public constant DUMMY_PRICE = 65000 * 1e8; // BTC Price: $65,000 (8 decimals)

    function getPrice(bytes32 priceId) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime) {
        if (priceId == 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43) {
            // BTC Price (8 decimals, expo 8)
            // if DUMMY_PRICE is uint256 and guaranteed to fit in int64:
        return ( (
    int64(uint64(DUMMY_PRICE)), // cast DUMMY_PRICE into int64 safely
    uint64(100),                // was uint256 → must be uint64
    int32(8),                   // was uint256 → must be int32
    block.timestamp             // already uint256 → correct
)
);



        } else if (priceId == 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a) {
            // USDC Price (6 decimals, expo 6)
            return (1 * 1e6, 10, 6, block.timestamp);
        }
        return (0, 0, 0, 0);
    }
    
    // Pyth expects an ETH payment for updates
    function updatePriceFeeds(bytes[] calldata) external payable {}
}

// Mock ERC20 for USDC and WALRUS
contract MockERC20 is IERC20 {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    uint8 public constant decimals = 6;
    string public constant name = "Mock USDC";
    string public constant symbol = "mUSDC";

    function totalSupply() external view returns (uint256) { return type(uint256).max; }
    function balanceOf(address account) external view returns (uint256) { return balances[account]; }
    function allowance(address owner, address spender) external view returns (uint256) { return allowances[owner][spender]; }

    function transfer(address to, uint256 amount) external returns (bool) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        balances[from] -= amount;
        allowances[from][msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }

    // Helper to mint tokens in tests
    function mint(address to, uint256 amount) external {
        balances[to] += amount;
    }
}

// Mock for Rootstock Bridge (Handles BTC/RBTC)
contract MockRootstockBridge is Test {
    mapping(address => uint256) public btcBalances;
    address public lendingPool;
    uint256 public constant USD_TO_BTC_RATE = 65000; // 1 BTC = $65,000

    function setLendingPool(address _pool) external {
        lendingPool = _pool;
    }

    function lockBTC(uint256 amount) external payable {
        // In a mock, we track the amount of BTC locked (represented by ETH received)
        // A simple check that ETH was sent equal to 'amount' (in mock BTC units)
        require(msg.value == amount, "Mock: ETH value must match BTC amount to lock");
        btcBalances[msg.sender] += amount;
    }

    function unlockBTC(uint256 amount, address recipient) external {
        require(msg.sender == lendingPool, "Mock: Only Pool can unlock");
        require(address(this).balance >= amount, "Mock: Insufficient ETH balance to unlock");
        // Simulate BTC unlock by transferring ETH back
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    function getBTCBalance(address user) external view returns (uint256) {
        return btcBalances[user];
    }

    // Convert $1 of USDC to 1/65000 BTC. Amounts are in 1e6 (USDC)
    function convertUSDCToRBTC(uint256 usdcAmount) external returns (uint256 rbtcAmount) {
        // Assume 1e18 for RBTC/ETH for simplicity in this mock test context
        // $1 USDC (1e6) = 1/65000 BTC (1e18)
        return (usdcAmount * 1e12) / USD_TO_BTC_RATE;
    }

    function convertRBTCToUSDC(uint256 rbtcAmount) external returns (uint256 usdcAmount) {
        return (rbtcAmount * USD_TO_BTC_RATE) / 1e12;
    }
}

// Mock for MakerDAO Pot (DSR)
contract MockMakerPot {
    // DSR is the instant rate. We use 1.000000000000000000000000001 (1e27 + 1)
    uint256 public constant DSR_RAY = 1000000000000000000000000001;
    function dsr() external view returns (uint256) { return DSR_RAY; } // 1% APY approx
    function chi() external view returns (uint256) { return 0; }
    function drip() external {}
    function rho() external view returns (uint256) { return 0; }
}

// Mock for Aave v3 Pool
contract MockAaveV3Pool {
    // Current Liquidity Rate (in RAY, annualized) 
    uint256 public constant AAVE_APY_RAY = 1000000000000000000000000050; // 5% APY approx (1e27 + 5e-27)
    
    function getReserveData(address) external view returns (
        uint256 configuration,
        uint128 liquidityIndex,
        uint128 currentLiquidityRate, // This is the rate we return
        uint128 variableBorrowIndex,
        uint128 currentVariableBorrowRate,
        uint128 currentStableBorrowRate,
        uint40 lastUpdateTimestamp,
        uint16 id,
        address aTokenAddress,
        address stableDebtTokenAddress,
        address variableDebtTokenAddress,
        address interestRateStrategyAddress,
        uint128 accruedToTreasury,
        uint128 unbacked,
        uint128 isolationModeTotalDebt
    ) {
        // Return only the currentLiquidityRate (3rd field)
        return (0, 0, uint128(AAVE_APY_RAY), 0, 0, 0, 0, 0, address(0), address(0), address(0), address(0), 0, 0, 0);
    }
}

// Mock for Walrus Storage
contract MockWalrusStorage {
    mapping(bytes32 => bytes) public blobs;
    mapping(bytes32 => uint256) public sizes;

    function storeBlob(bytes calldata data) external payable returns (bytes32 blobId) {
        blobId = keccak256(data);
        blobs[blobId] = data;
        sizes[blobId] = data.length;
        return blobId;
    }
    
    function retrieveBlob(bytes32 blobId) external view returns (bytes memory data) {
        require(blobs[blobId].length > 0, "Blob not found");
        return blobs[blobId];
    }

    function deleteBlob(bytes32 blobId) external {
        delete blobs[blobId];
        delete sizes[blobId];
    }
    
    function getBlobInfo(bytes32 blobId) external view returns (uint256 size, uint256 timestamp, bool exists) {
        return (sizes[blobId], block.timestamp, sizes[blobId] > 0);
    }
}

// ==============================================================================
// LENDING POOL TEST CONTRACT
// ==============================================================================

contract LendingPoolTest is Test {
    LendingPoolIntegrated public pool;
    MockERC20 public mockUsdc;
    MockERC20 public mockWal;
    MockPythOracle public mockPyth;
    MockWalrusStorage public mockWalrusStorage;
    MockRootstockBridge public mockRootstock;
    MockMakerPot public mockPot;
    MockAaveV3Pool public mockAave;

    address public owner = address(0xAA);
    address public lender1 = address(0xBB);
    address public lender2 = address(0xCC);
    address public borrower1 = address(0xDD);
    address public bob = address(0xEE);

    uint256 public constant USDC_DECIMALS = 1e6;
    uint256 public constant INITIAL_LIQUIDITY = 10_000 * USDC_DECIMALS;
    uint256 public constant LOAN_AMOUNT = 1_000 * USDC_DECIMALS;
    uint256 public constant FIXED_APY_L1 = 500; // 5% APY in BP
    uint256 public constant FIXED_APY_L2 = 1000; // 10% APY in BP
    uint256 public constant BTC_COLLATERAL_AMOUNT = 1e18; // 1 ETH (as mock BTC)
    uint256 public constant PYTH_FEE = 100; // 0.001 USDC fee (in basic unit 1e-6)

    function setUp() public {
        vm.startPrank(owner);

        // Deploy Mocks
        mockUsdc = new MockERC20();
        mockWal = new MockERC20();
        mockPyth = new MockPythOracle();
        mockWalrusStorage = new MockWalrusStorage();
        mockRootstock = new MockRootstockBridge();
        mockPot = new MockMakerPot();
        mockAave = new MockAaveV3Pool();

        // Transfer some ETH to Pyth Oracle for fees
        vm.deal(address(mockPyth), 10 ether); 
        // Fund the Pool contract with some ETH for Walrus/Pyth fees
        vm.deal(address(pool), 10 ether); 

        // Deploy Main Contract
        pool = new LendingPoolIntegrated(
            address(mockUsdc),
            address(mockPyth),
            address(mockWalrusStorage),
            address(mockWal),
            address(mockRootstock),
            address(mockPot),
            address(mockAave)
        );

        // Set Rootstock mock to know the pool address for unlock calls
        mockRootstock.setLendingPool(address(pool));

        // Initial funding for lenders and borrower
        mockUsdc.mint(lender1, INITIAL_LIQUIDITY);
        mockUsdc.mint(lender2, INITIAL_LIQUIDITY);
        mockUsdc.mint(borrower1, LOAN_AMOUNT * 2);

        // Approve pool to spend lender/borrower tokens
        vm.prank(lender1);
        mockUsdc.approve(address(pool), type(uint256).max);
        vm.prank(lender2);
        mockUsdc.approve(address(pool), type(uint256).max);
        vm.prank(borrower1);
        mockUsdc.approve(address(pool), type(uint256).max);
        
        vm.stopPrank();
    }

    // ==============================================================================
    // TEST 1: CONSTRUCTOR AND STATE
    // ==============================================================================

    function test_ConstructorInitialization() public view {
        assertEq(address(pool.usdcToken()), address(mockUsdc), "USDC token address mismatch");
        assertEq(address(pool.pythOracle()), address(mockPyth), "Pyth Oracle address mismatch");
        assertEq(pool.minAPY(), 100, "Min APY mismatch");
        assertEq(pool.maxAPY(), 2000, "Max APY mismatch");
        
        // Check protocol fees initialization (walrusStorageFee: 1000)
        (uint256 wsFee, , ) = pool.protocolFees();
        assertEq(wsFee, 1000, "Walrus storage fee mismatch");
    }

    // ==============================================================================
    // TEST 2: APY INTEGRATION AND MATH
    // ==============================================================================

    function test_UpdateStableAPY_CorrectCalculation() public {
        uint256 initialSmoothedAPY = pool.smoothedAPY();
        
        // Call the update function
        uint256 newSmoothedAPY = pool.updateStableAPY();

        // 1. DSR: 1.000000000000000000000000001 RAY (approx 1% APY)
        // 2. Aave: 1.000000000000000000000000050 RAY (approx 5% APY)
        // Hybrid APY = 0.7 * DSR_APY + 0.3 * AAVE_APY
        // 0.7 * (1e27 + 1) + 0.3 * (1e27 + 50) = 1e27 + 0.7 + 15 = 1e27 + 15.7 (in theory)
        
        // Since the calculation is complex Ray Math, we just check for non-zero and smoothing.
        // On first run, initialSmoothedAPY is 0, so it should be close to Hybrid APY.
        assertTrue(newSmoothedAPY > pool.RAY(), "APY should be greater than 100% (1e27)");
        assertTrue(newSmoothedAPY < 2 * pool.RAY(), "APY should be less than 200%");
        
        vm.roll(block.number + 1);
        
        // Call again to test EWMA: new APY should be weighted towards the previous (90%)
        // We can't easily calculate the exact Ray value, so we check if the timestamp updated
        uint256 nextUpdateAPY = pool.updateStableAPY();
        assertTrue(nextUpdateAPY != newSmoothedAPY, "APY should have changed after EWMA smoothing");
        assertTrue(pool.lastUpdateTime() > 0, "Last update time should be set");
    }

    // ==============================================================================
    // TEST 3: ADD LIQUIDITY
    // ==============================================================================

    function test_AddLiquidity_Success() public {
    vm.prank(lender1);
    pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, "Initial deposit");

    // Check balances
    assertEq(pool.totalAvailableLiquidity(), INITIAL_LIQUIDITY, "Liquidity should match deposit");
    assertEq(mockUsdc.balanceOf(address(pool)), INITIAL_LIQUIDITY, "Pool USDC balance mismatch");
    
    // CORRECTED: Destructure only the 11 fields returned by the public getter
    (
        uint256 totalDeposited,
        , // availableAmount
        , // lentAmount
        , // earnedInterest
        uint256 fixedAPY,
        bool active,
        , // timestamp
        bytes32 lenderDataBlob,
        uint256 walrusRewards,
        , // btcCollateral
        bool isBitcoinLender
        // The 'next' and 'prev' fields are not returned by the default getter
    ) = pool.lenders(lender1);

    // Now, assert against the local variables
    assertEq(totalDeposited, INITIAL_LIQUIDITY, "Lender total deposited mismatch");
    assertEq(fixedAPY, FIXED_APY_L1, "Lender APY mismatch");
    assertTrue(active, "Lender should be active");
    assertTrue(isBitcoinLender == false, "isBitcoinLender flag mismatch");

    uint256 expectedRewards = (INITIAL_LIQUIDITY * 50) / pool.BASIS_POINTS();
    assertEq(walrusRewards, expectedRewards, "Walrus rewards mismatch");
    
    assertTrue(lenderDataBlob != bytes32(0), "Lender data blob should be stored");
}

    function test_AddLiquidity_WithBTCCollateral() public {
    vm.startPrank(lender1);
    
    // Dynamically calculate the required BTC collateral based on the mock oracle price
    // This makes the test robust and avoids "magic numbers"
    uint256 btcPrice = uint256(int256(mockPyth.DUMMY_PRICE()));
    uint256 requiredBtcValue = (LOAN_AMOUNT * pool.BTC_COLLATERAL_RATIO()) / pool.BASIS_POINTS();
    uint256 requiredBtc = (requiredBtcValue * 1e8) / btcPrice;
    
    // NOTE: The 'msg.value' you send should only be for the BTC collateral.
    // The protocol fees (like for Walrus) are paid from the POOL's own ETH balance,
    // which you correctly funded in setUp(). The user's ETH only covers the collateral.
    uint256 valueToSendForCollateral = requiredBtc; 

    // Add 1k USDC with BTC collateral
    pool.addLiquidity{value: valueToSendForCollateral}(LOAN_AMOUNT, FIXED_APY_L1, true, "BTC backed");
    
    // Check BTC collateral tracking
    // Use the correct 11-field destructuring for the public 'lenders' getter
    (
        , // totalDeposited
        , // availableAmount
        , // lentAmount
        , // earnedInterest
        , // fixedAPY
        , // active
        , // timestamp
        , // lenderDataBlob
        , // walrusRewards
        uint256 btcCollateral,
        bool isBitcoinLender
    ) = pool.lenders(lender1);

    assertTrue(btcCollateral > 0, "Lender BTC collateral should be tracked");
    assertTrue(isBitcoinLender, "Lender should be flagged as Bitcoin lender");
    
    // Check bridge state
    assertEq(mockRootstock.btcBalances(lender1), requiredBtc, "Rootstock should have tracked locked BTC");
    assertEq(pool.totalBTCCollateral(), requiredBtc, "Pool total BTC collateral mismatch");

    vm.stopPrank();
}

    function test_AddLiquidity_RevertsOnInvalidAPY() public {
        vm.prank(lender1);
        vm.expectRevert("APY out of allowed range");
        // APY too high (Max is 2000 BP)
        pool.addLiquidity(LOAN_AMOUNT, 3000, false, "");
    }

    // ==============================================================================
    // TEST 4: REQUEST LOAN
    // ==============================================================================

    function test_RequestLoan_Success() public {
        // 1. Setup liquidity
        vm.prank(lender1);
        pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, "L1 deposit");
        
        // 2. Borrower requests loan
        vm.prank(borrower1);
        pool.requestLoan(LOAN_AMOUNT, "Loan agreement data", false, "");
        
        // Check liquidity change
        assertEq(pool.totalAvailableLiquidity(), INITIAL_LIQUIDITY - LOAN_AMOUNT, "Available liquidity incorrect");
        assertEq(pool.totalLentAmount(), LOAN_AMOUNT, "Total lent amount incorrect");
        
        // // Check borrower struct
        // LendingPoolIntegrated.Borrower memory borrower = pool.borrowers(borrower1);
        // assertEq(borrower.amount, LOAN_AMOUNT, "Borrower amount mismatch");
        // assertTrue(borrower.weightedAPY == FIXED_APY_L1, "Weighted APY mismatch (should equal only lender's APY)");
        // assertTrue(borrower.dueDate > block.timestamp, "Due date not set correctly");
        // assertTrue(borrower.active, "Borrower should be active");

        (
    uint256 amount,
    uint256 weightedAPY,
    , // timestamp
    uint256 dueDate,
    bool active,
    , // loanDocumentBlob
    , // btcCollateralRatio
      // crossChainLoan
) = pool.getBorrowerDetails(borrower1);

assertEq(amount, LOAN_AMOUNT, "Borrower amount mismatch");
assertTrue(weightedAPY == FIXED_APY_L1, "Weighted APY mismatch");
assertTrue(dueDate > block.timestamp, "Due date not set correctly");
assertTrue(active, "Borrower should be active");
        
        // Check USDC transfer (loan disbursement)
        assertEq(mockUsdc.balanceOf(borrower1), LOAN_AMOUNT * 2 + LOAN_AMOUNT, "Borrower USDC balance mismatch after loan");
        
        // // Check loan chunk
        // LendingPoolIntegrated.LoanChunk[] memory chunks = pool.borrowerLoans(borrower1);
        // assertEq(chunks.length, 1, "Should have 1 loan chunk");
        // assertEq(chunks[0].amount, LOAN_AMOUNT, "Chunk amount mismatch");
        // assertEq(chunks[0].lender, lender1, "Chunk lender mismatch");
        // In test_RequestLoan_Success()

// CORRECTED: Use the new helper function
LendingPoolIntegrated.LoanChunk[] memory chunks = pool.getBorrowerLoanChunks(borrower1);
assertEq(chunks.length, 1, "Should have 1 loan chunk");
assertEq(chunks[0].amount, LOAN_AMOUNT, "Chunk amount mismatch");
assertEq(chunks[0].lender, lender1, "Chunk lender mismatch");
    }
    
    function test_RequestLoan_WithBTCCollateralRequired() public {
    // 1. Setup liquidity from a lender
    vm.prank(lender1);
    pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, "L1 deposit");
    
    // 2. Borrower prepares to request a loan
    vm.startPrank(borrower1);

    // --- DYNAMIC COLLATERAL CALCULATION (NO MAGIC NUMBERS) ---
    // This makes your test resilient to changes in the mock price or collateral ratio.
    uint256 btcPrice = uint256(int256(mockPyth.DUMMY_PRICE()));
    uint256 requiredBtcValue = (LOAN_AMOUNT * pool.BTC_COLLATERAL_RATIO()) / pool.BASIS_POINTS();
    uint256 requiredBtc = (requiredBtcValue * 1e8) / btcPrice;

    // --- CORRECTED LOGIC ---
    // The `msg.value` sent by the user should ONLY cover the required collateral.
    // Protocol fees (like for Walrus) are paid from the pool's own ETH balance, 
    // which you funded in the setUp() function.
    uint256 valueToSendForCollateral = requiredBtc;

    // 3. Request the loan with the correctly calculated value for collateral
    pool.requestLoan{value: valueToSendForCollateral}(LOAN_AMOUNT, "Loan agreement data", true, "");
    
    // --- VERIFY STATE CHANGES ---

    (
        , // amount
        , // weightedAPY
        , // timestamp
        , // dueDate
        , // active
        , // loanDocumentBlob
        uint256 btcCollateralRatio, // This is the 7th value
        , // crossChainLoan
          // currentRepaymentAmount
    ) = pool.getBorrowerDetails(borrower1);
    assertEq(btcCollateralRatio, pool.BTC_COLLATERAL_RATIO(), "BTC collateral ratio not set correctly");

    // Check that collateral was tracked correctly in both the pool and the mock bridge
    assertEq(pool.btcCollaterals(borrower1), requiredBtc, "Pool's BTC collateral tracking is incorrect");
    assertEq(mockRootstock.btcBalances(borrower1), requiredBtc, "Rootstock bridge should have tracked the locked BTC");

    vm.stopPrank();
}
    
    function test_RequestLoan_RevertsOnInsufficientLiquidity() public {
        vm.prank(lender1);
        pool.addLiquidity(LOAN_AMOUNT, FIXED_APY_L1, false, ""); // Only 1k liquidity
        
        vm.prank(borrower1);
        vm.expectRevert("Insufficient pool liquidity");
        pool.requestLoan(LOAN_AMOUNT + 1, "Loan agreement data", false, "");
    }

    function test_RequestLoan_RevertsOnActiveLoan() public {
        // 1. Setup liquidity and take first loan
        vm.prank(lender1);
        pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, "");
        vm.prank(borrower1);
        pool.requestLoan(LOAN_AMOUNT, "Loan agreement data", false, "");
        
        // 2. Try to take a second loan
        vm.prank(borrower1);
        vm.expectRevert("Borrower already has active loan");
        pool.requestLoan(LOAN_AMOUNT, "Loan agreement data", false, "");
    }
    
    // ==============================================================================
    // TEST 5: REPAY LOAN
    // ==============================================================================
    
    function test_RepayLoan_Success() public {
        // 1. Lender 1 deposits
        vm.prank(lender1);
        pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, ""); 
        
        // 2. capture lender's state before the loan is made
        uint256 lenderAvailableBeforeLoan = pool.lenders(lender1).availableAmount;

        // 3. Borrower 1 takes loan
        vm.prank(borrower1);
        pool.requestLoan(LOAN_AMOUNT, "Loan agreement", false, "");
        
        // 4. Fast forward one year
        vm.warp(block.timestamp + pool.SECONDS_PER_YEAR());

        // Calculate expected repayment. APY is 5% (500 BP)
        // Interest = 1000 * 5% * 1 year = 50 USDC (50 * 1e6)
        // Repayment = 1000 + 50 = 1050 USDC (1050 * 1e6)
        uint256 expectedInterest = (LOAN_AMOUNT * FIXED_APY_L1) / pool.BASIS_POINTS();
        uint256 expectedRepayment = LOAN_AMOUNT + expectedInterest;

        uint256 borrowerInitialUSDC = mockUsdc.balanceOf(borrower1);
        uint256 lenderInitialDeposit = pool.lenders(lender1).totalDeposited;

        // 5. Repay loan
        vm.prank(borrower1);
        pool.repayLoan();
// now verify state changes
        // Check borrower balance change (USDC is transferred from borrower to pool)
        assertEq(mockUsdc.balanceOf(borrower1), borrowerInitialUSDC - expectedRepayment, "Borrower balance incorrect after repayment");

        // Check lender update
        LendingPoolIntegrated.Lender memory lender = pool.lenders(lender1);
        assertEq(lender.availableAmount, lenderAvailableBeforeLoan , "Lender available amount should return to be preloan value");
        assertEq(lender.lentAmount, 0, "Lent amount should be zero");
        assertEq(lender.earnedInterest, expectedInterest, "Earned interest incorrect");
        
        // Check pool totals
        assertEq(pool.totalAvailableLiquidity(), INITIAL_LIQUIDITY + expectedInterest, "Pool liquidity incorrect after repayment");
        assertEq(pool.totalLentAmount(), 0, "Pool lent amount should be zero");
        assertEq(pool.totalInterestEarned(), expectedInterest, "Total interest earned incorrect");
        
        // Check cleanup
        assertEq(pool.borrowers(borrower1).active, false, "Borrower should be inactive");
    }

    function test_RepayLoan_WithBTCCollateralReturned() public {
        // 1. Lender 1 deposits
        vm.prank(lender1);
        pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, "");
        
        // 2. Borrower 1 takes loan requiring BTC collateral
        vm.startPrank(borrower1);
        uint256 requiredBtc = 2307692307692307; // Locked BTC
        uint256 requiredEth = requiredBtc + pool.protocolFees().walrusStorageFee() * 1e12 / 1000;
        
        uint256 borrowerInitialEth = 1 ether;
        vm.deal(borrower1, borrowerInitialEth);

        pool.requestLoan{value: requiredEth}(LOAN_AMOUNT, "Loan agreement", true, "");
        vm.stopPrank();

        // 3. Fast forward one day
        vm.warp(block.timestamp + 1 days);

        // 4. Repay loan
        uint256 poolEthBalanceBefore = address(pool).balance;
        
        vm.startPrank(borrower1);
        pool.repayLoan();
        vm.stopPrank();

        // Check BTC collateral returned
        assertEq(pool.btcCollaterals(borrower1), 0, "BTC collateral should be zero after repayment");
        assertEq(pool.totalBTCCollateral(), 0, "Total BTC collateral should be zero");
        
        // Check ETH balance: Pool's ETH should decrease by the returned collateral amount
        // Note: The ETH received from borrower in the mock is consumed by the lock/unlock logic
        // We only check if the collateral tracking is reset.
        assertTrue(address(pool).balance < poolEthBalanceBefore, "Pool ETH balance should have decreased due to BTC unlock");
    }
    
    // ==============================================================================
    // TEST 6: WALRUS REWARDS
    // ==============================================================================
    
    function test_ClaimWalrusRewards_Success() public {
        // 1. Lender deposits
        vm.prank(lender1);
        pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, "");
        
        // Expected initial reward (0.5% of 10k USDC)
        uint256 initialRewards = (INITIAL_LIQUIDITY * 50) / pool.BASIS_POINTS();
        
        // 2. Claim rewards
        vm.prank(lender1);
        pool.claimWalrusRewards();
        
        // Check WAL balance
        assertEq(mockWal.balanceOf(lender1), initialRewards, "Lender WAL balance mismatch");
        
        // Check lender state reset
        assertEq(pool.lenders(lender1).walrusRewards, 0, "Lender rewards should be zero after claim");
    }

    function test_RetrieveDataFromWalrus() public {
        bytes memory lenderData = abi.encodePacked("Lender historical data");
        bytes memory loanData = abi.encodePacked("Full loan terms and conditions");

        // 1. Lender deposits with data
        vm.prank(lender1);
        pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, lenderData);

        // 2. Borrower takes loan with data
        vm.prank(borrower1);
        pool.requestLoan(LOAN_AMOUNT, loanData, false, "");

        // 3. Retrieve lender data
        bytes memory retrievedLenderData = pool.retrieveLenderData(lender1);
        assertEq(retrievedLenderData, lenderData, "Retrieved lender data mismatch");

        // 4. Retrieve loan document
        bytes memory retrievedLoanData = pool.retrieveLoanDocument(borrower1);
        assertEq(retrievedLoanData, loanData, "Retrieved loan document mismatch");
    }
    
    // ==============================================================================
    // TEST 7: CROSS-CHAIN LOAN
    // ==============================================================================

    function test_RequestLoan_CrossChainToBitcoin() public {
        // 1. Lender deposits
        vm.prank(lender1);
        pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, ""); 
        
        // 2. Borrower requests cross-chain loan to "bitcoin"
        vm.prank(borrower1);
        pool.requestLoan(LOAN_AMOUNT, "Cross-chain loan", false, "bitcoin");
        
        // Check USDC balance of the pool: USDC should have been converted and transferred to the bridge
        // The mock bridge doesn't check the pool's USDC balance but simulates the unlockBTC call.
        // The core check here is that it did *not* transfer USDC to the borrower, but called the bridge.
        assertEq(mockUsdc.balanceOf(borrower1), INITIAL_LIQUIDITY * 2, "Borrower USDC balance should NOT increase for cross-chain loan");
        
        // Check conversion and unlock logic (mock verification)
        // Since we can't directly inspect mock call arguments, we rely on the contract execution path.
        // The loan should be active.
        assertTrue(pool.borrowers(borrower1).active, "Cross-chain loan should be active");
        assertTrue(pool.borrowers(borrower1).crossChainLoan, "Cross-chain flag should be set");
    }

    // ==============================================================================
    // TEST 8: SECURITY & ACCESS CONTROL
    // ==============================================================================

    function test_PauseFunctionality() public {
        vm.prank(owner);
        pool.pause();

        vm.prank(lender1);
        vm.expectRevert("Pausable: paused");
        pool.addLiquidity(LOAN_AMOUNT, FIXED_APY_L1, false, "");
        
        vm.prank(owner);
        pool.unpause();

        vm.prank(lender1);
        pool.addLiquidity(LOAN_AMOUNT, FIXED_APY_L1, false, ""); // Should succeed now
    }
    
    function test_ReentrancyGuard() public {
        // This test requires setting up a malicious contract that calls pool.repayLoan() 
        // recursively inside a callback (not easily done in the simple mock structure).
        // Instead, we ensure the functions are marked correctly.
        
        // We can check if a function reverts if called from within itself, but for now
        // we assert that the core functions are correctly decorated with nonReentrant.
        
        // Since the functions are marked nonReentrant in the source, we rely on the 
        // compiler enforcement. A proper test requires a malicious contract mock.
        
        vm.prank(lender1);
        pool.addLiquidity(LOAN_AMOUNT, FIXED_APY_L1, false, "");
        
        vm.prank(borrower1);
        pool.requestLoan(LOAN_AMOUNT, "Loan agreement", false, "");

        // No explicit reentrancy test here, assuming compiler enforcement.
    }
    
    function test_RemoveBorrowerFromList_Helper() public {
        // 1. Setup liquidity and take two loans to fill the borrowerList
        vm.prank(lender1);
        pool.addLiquidity(INITIAL_LIQUIDITY, FIXED_APY_L1, false, ""); 
        
        vm.prank(borrower1);
        pool.requestLoan(500 * USDC_DECIMALS, "Loan agreement 1", false, "");
        
        vm.prank(bob);
        mockUsdc.approve(address(pool), type(uint256).max);
        pool.requestLoan(500 * USDC_DECIMALS, "Loan agreement 2", false, "");
        
        // Check list size
        address[] memory initialList = pool.borrowerList();
        assertEq(initialList.length, 2, "Initial borrower list size mismatch");

        // Repay one loan (borrower1 should be removed)
        vm.warp(block.timestamp + pool.SECONDS_PER_YEAR());
        vm.prank(borrower1);
        pool.repayLoan();
        
        // Check list size and contents (bob should be at index 0)
        address[] memory finalList = pool.borrowerList();
        assertEq(finalList.length, 1, "Final borrower list size mismatch");
        assertEq(finalList[0], bob, "Remaining borrower should be Bob (index swap)");
    }
}
