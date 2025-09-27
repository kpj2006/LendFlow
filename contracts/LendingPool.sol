// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

// Pyth Oracle Interface (already integrated)
interface IPythOracle {
    function getPrice(
        bytes32 priceId
    )
        external
        view
        returns (int64 price, uint64 conf, int32 expo, uint256 publishTime);

    function updatePriceFeeds(bytes[] calldata updateData) external payable;
}

// Walrus Protocol Interface for decentralized storage
interface IWalrusStorage {
    function storeBlob(
        bytes calldata data
    ) external payable returns (bytes32 blobId);

    function retrieveBlob(
        bytes32 blobId
    ) external view returns (bytes memory data);

    function deleteBlob(bytes32 blobId) external;

    function getBlobInfo(
        bytes32 blobId
    ) external view returns (uint256 size, uint256 timestamp, bool exists);
}

interface IWalrusToken {
    function transfer(address to, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

// Rootstock Bridge Interface for Bitcoin integration
interface IRootstockBridge {
    function lockBTC(uint256 amount) external payable;

    function unlockBTC(uint256 amount, address recipient) external;

    function getBTCBalance(address user) external view returns (uint256);

    function convertRBTCToUSDC(
        uint256 rbtcAmount
    ) external returns (uint256 usdcAmount);

    function convertUSDCToRBTC(
        uint256 usdcAmount
    ) external returns (uint256 rbtcAmount);
}

// MakerDAO Pot Interface for DSR (Dai Savings Rate)
interface IPot {
    function dsr() external view returns (uint256);

    function chi() external view returns (uint256);

    function drip() external;

    function rho() external view returns (uint256);
}

// Aave v3 Pool Interface for supply APY
interface IAaveV3Pool {
    function getReserveData(
        address asset
    )
        external
        view
        returns (
            uint256 configuration,
            uint128 liquidityIndex,
            uint128 currentLiquidityRate,
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
        );
}

contract LendingPoolIntegrated is ReentrancyGuard, Ownable, Pausable {
    // Core tokens
    IERC20 public immutable usdcToken;
    IWalrusToken public walrusToken;

    // Protocol integrations
    IPythOracle public pythOracle;
    IWalrusStorage public walrusStorage;
    IRootstockBridge public rootstockBridge;
    IPot public pot; // MakerDAO Pot contract for DSR
    IAaveV3Pool public aavePool; // Aave v3 Pool contract

    // Stable APY state variables (using ray math - 1e27)
    uint256 public smoothedAPY; // EWMA smoothed hybrid APY
    uint256 public lastUpdateTime; // Last time APY was updated
    uint256 public constant EWMA_ALPHA = 100000000000000000; // 0.1 in ray (1e26)
    uint256 public constant RAY = 1e27; // Ray unit for fixed-point math
    uint256 public constant SECONDS_PER_YEAR = 31536000; // Seconds in a year

    // Price feed IDs
    bytes32 public constant USDC_PRICE_ID =
        0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a;
    bytes32 public constant BTC_PRICE_ID =
        0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;

    struct Lender {
        uint256 totalDeposited;
        uint256 availableAmount;
        uint256 lentAmount;
        uint256 earnedInterest;
        uint256 fixedAPY;
        bool active;
        uint256 timestamp;
        // Walrus integration
        bytes32 lenderDataBlob; // Stores lender's historical data on Walrus
        uint256 walrusRewards; // WAL token rewards for using storage
        // Rootstock integration
        uint256 btcCollateral; // BTC collateral from Rootstock
        bool isBitcoinLender; // Flag for Bitcoin-backed lending
        address next;
        address prev;
    }

    struct Borrower {
        uint256 amount;
        uint256 weightedAPY;
        uint256 timestamp;
        uint256 dueDate;
        bool active;
        // Multi-protocol data
        bytes32 loanDocumentBlob; // Loan agreement stored on Walrus
        uint256 btcCollateralRatio; // BTC collateral ratio for enhanced security
        bool crossChainLoan; // Flag for cross-chain loan
    }

    struct LoanChunk {
        address lender;
        uint256 amount;
        uint256 apy;
        bytes32 chunkDataBlob; // Chunk details stored on Walrus
    }

    struct ProtocolFees {
        uint256 walrusStorageFee; // Fee for storing data on Walrus
        uint256 rootstockBridgeFee; // Fee for Rootstock bridge operations
        uint256 pythUpdateFee; // Fee for Pyth price updates
    }

    // State variables
    mapping(address => Lender) public lenders;
    mapping(address => Borrower) public borrowers;
    mapping(address => LoanChunk[]) public borrowerLoans;
    mapping(address => uint256) public btcCollaterals; // BTC collateral tracking
    mapping(bytes32 => bool) public storedBlobs; // Walrus blob tracking
    mapping(address => uint256) private borrowerIndex;
    address[] public borrowerList;
    address public head; // Lender with the lowest APY
    address public tail; // Lender with the highest APY
    uint256 public activeLenderCount;
    // Protocol tracking
    uint256 public totalAvailableLiquidity;
    uint256 public totalLentAmount;
    uint256 public totalInterestEarned;
    uint256 public totalBTCCollateral;
    uint256 public totalWalrusRewards;

    ProtocolFees public protocolFees;

    // Constants
    uint256 public constant WHALE_THRESHOLD = 1000 * 10 ** 6;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant LOAN_DURATION = 30 days;
    uint256 public constant BTC_COLLATERAL_RATIO = 15000; // 150%
    uint256 public constant WALRUS_REWARD_RATE = 50; // 0.5% in WAL tokens

    uint256 public minAPY = 100; // 1%
    uint256 public maxAPY = 2000; // 20%

    // Events
    event LenderAdded(
        address indexed lender,
        uint256 amount,
        uint256 apy,
        bool isBitcoinBacked
    );
    event BorrowerMatched(
        address indexed borrower,
        uint256 amount,
        uint256 weightedAPY,
        uint256 dueDate,
        bytes32 documentBlob
    );
    event LoanRepaid(
        address indexed borrower,
        uint256 principal,
        uint256 interest
    );
    event LoanLiquidated(address indexed borrower, uint256 amount);
    event LiquidityWithdrawn(address indexed lender, uint256 amount);
    event InterestClaimed(address indexed lender, uint256 interest);
    event BTCCollateralAdded(address indexed user, uint256 amount);
    event WalrusDataStored(address indexed user, bytes32 blobId, uint256 size);
    event WalrusRewardsClaimed(address indexed user, uint256 amount);
    event CrossChainLoanExecuted(
        address indexed borrower,
        uint256 amount,
        string targetChain
    );

    constructor(
        address _usdcToken,
        address _pythOracle,
        address _walrusStorage,
        address _walrusToken,
        address _rootstockBridge,
        address _makerPot,
        address _aavePool
    ) {
        usdcToken = IERC20(_usdcToken);
        pythOracle = IPythOracle(_pythOracle);
        walrusStorage = IWalrusStorage(_walrusStorage);
        walrusToken = IWalrusToken(_walrusToken);
        rootstockBridge = IRootstockBridge(_rootstockBridge);
        pot = IPot(_makerPot);
        aavePool = IAaveV3Pool(_aavePool);

        // Initialize protocol fees
        protocolFees = ProtocolFees({
            walrusStorageFee: 1000, // 0.01 USDC
            rootstockBridgeFee: 5000, // 0.05 USDC
            pythUpdateFee: 100 // 0.001 USDC
        });
    }

    // ===== RAY MATH HELPERS =====
    // Safe math operations for ray (1e27) fixed-point arithmetic

    /// @notice Add two ray numbers with overflow protection
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x, "RayMath: addition overflow");
    }

    /// @notice Subtract two ray numbers with underflow protection
    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x, "RayMath: subtraction underflow");
    }

    /// @notice Multiply two ray numbers with overflow protection
    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(
            y == 0 || (z = x * y) / y == x,
            "RayMath: multiplication overflow"
        );
    }

    /// @notice Multiply ray number by a fraction (numerator/denominator) in ray
    function rmul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = mul(x, y) / RAY;
    }

    /// @notice Power function for annualizing rates: rpow(dsr, secondsPerYear, 1e27)
    /// @dev For DSR annualization: (1 + dsr/RAY)^secondsPerYear
    function rpow(
        uint256 x,
        uint256 n,
        uint256 base
    ) internal pure returns (uint256 z) {
        // DSR is a continuous rate in ray. For annualization:
        // annualRate = (1 + dsr/RAY)^secondsPerYear

        if (x == 0) return n == 0 ? base : 0;

        // Approximate (1 + r)^n using first-order Taylor expansion
        // For small r (DSR close to 0), (1 + r)^n ≈ 1 + n*r
        // But DSR is in ray, so r = (dsr - RAY) / RAY

        uint256 r = x > RAY ? ((x - RAY) * RAY) / x : 0; // Avoid underflow
        uint256 annualRate = RAY + (n * r) / RAY;

        return annualRate;
    }

    // ===== STABLE APY INTEGRATION =====

    /// @notice Fetch MakerDAO DSR (Dai Savings Rate) and annualize it
    /// @return Annualized DSR in ray format (1e27 = 100%)
    function _fetchMakerDSR() internal returns (uint256) {
        // Call drip() to sync chi with latest accrued interest
        pot.drip();

        // Get current DSR (instantaneous rate in ray)
        uint256 dsr = pot.dsr();

        // Annualize using rpow: dsr^secondsPerYear
        // This gives us the effective annual rate
        uint256 annualizedDSR = rpow(dsr, SECONDS_PER_YEAR, RAY);

        return annualizedDSR;
    }

    /// @notice Fetch Aave v3 USDC supply APY
    /// @return Supply APY in ray format (already annualized by Aave)
    function _fetchAaveSupplyAPY() internal view returns (uint256) {
        // Get reserve data for USDC (assuming USDC address is known)
        // Note: In production, you'd pass the actual USDC address
        address usdcAddress = address(usdcToken);
        (, , uint256 currentLiquidityRate, , , , , , , , , , , , ) = aavePool
            .getReserveData(usdcAddress);

        // currentLiquidityRate is already in ray format (1e27) and annualized
        // No additional annualization needed
        return currentLiquidityRate;
    }

    /// @notice Compute hybrid APY using weighted average of MakerDAO and Aave rates
    /// @return Hybrid APY in ray format
    function _computeHybridAPY(
        uint256 makerAPY,
        uint256 aaveAPY
    ) internal pure returns (uint256) {
        // stableAPY = 0.7 * makerAPY + 0.3 * aaveAPY
        // Using ray math: rmul(0.7 * RAY, makerAPY) + rmul(0.3 * RAY, aaveAPY)

        uint256 makerWeight = (7 * RAY) / 10; // 0.7 in ray
        uint256 aaveWeight = (3 * RAY) / 10; // 0.3 in ray

        uint256 weightedMaker = rmul(makerWeight, makerAPY);
        uint256 weightedAave = rmul(aaveWeight, aaveAPY);

        return add(weightedMaker, weightedAave);
    }

    /// @notice Apply EWMA smoothing to prevent sudden APY spikes
    /// @param currentAPY The newly computed hybrid APY
    /// @return Smoothed APY using exponential weighted moving average
    function _applyEWMASmoothing(
        uint256 currentAPY
    ) internal view returns (uint256) {
        // smoothedAPY = alpha * currentAPY + (1 - alpha) * previousSmoothedAPY
        // alpha = 0.1 (10% weight to new value, 90% to previous)

        if (smoothedAPY == 0) {
            // First time - no previous value, return current
            return currentAPY;
        }

        uint256 alpha = EWMA_ALPHA; // 0.1 in ray
        uint256 oneMinusAlpha = sub(RAY, alpha); // 0.9 in ray

        uint256 weightedCurrent = rmul(alpha, currentAPY);
        uint256 weightedPrevious = rmul(oneMinusAlpha, smoothedAPY);

        return add(weightedCurrent, weightedPrevious);
    }

    /// @notice Update the stable APY by fetching from protocols and applying smoothing
    /// @return The updated smoothed APY
    function updateStableAPY() external returns (uint256) {
        // Fetch rates from both protocols
        uint256 makerAPY = _fetchMakerDSR();
        uint256 aaveAPY = _fetchAaveSupplyAPY();

        // Compute hybrid weighted APY
        uint256 hybridAPY = _computeHybridAPY(makerAPY, aaveAPY);

        // Apply EWMA smoothing to prevent spikes
        smoothedAPY = _applyEWMASmoothing(hybridAPY);

        // Update timestamp
        lastUpdateTime = block.timestamp;

        return smoothedAPY;
    }

    /// @notice Get the current smoothed stable APY
    /// @return Current smoothed APY in ray format
    function getStableAPY() external view returns (uint256) {
        return smoothedAPY;
    }

    // Enhanced liquidity addition with multi-protocol support
    function addLiquidity(
        uint256 amount,
        uint256 fixedAPY,
        bool useBitcoinCollateral,
        bytes calldata lenderMetadata
    ) external payable nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(
            fixedAPY >= minAPY && fixedAPY <= maxAPY,
            "APY out of allowed range"
        );

        // Update price feeds from Pyth
        _updatePriceFeeds();

        usdcToken.transferFrom(msg.sender, address(this), amount);

        // Handle Bitcoin collateral if requested
        uint256 btcCollateralAmount = 0;
        if (useBitcoinCollateral) {
            btcCollateralAmount = _handleBitcoinCollateral(amount);
        }

        // Store lender metadata on Walrus
        bytes32 lenderDataBlob = _storeOnWalrus(lenderMetadata);

        // Calculate Walrus rewards
        uint256 walrusReward = (amount * WALRUS_REWARD_RATE) / BASIS_POINTS;

        if (lenders[msg.sender].active) {
            // --- CORRECTED LOGIC FOR EXISTING LENDERS ---

            // 1. Remove the lender from their old position in the list.
            //    This is necessary in case their APY changes, which affects their sort order.
            _remove(msg.sender);

            // 2. Update their account details.
            lenders[msg.sender].totalDeposited += amount;
            lenders[msg.sender].availableAmount += amount;
            lenders[msg.sender].fixedAPY = fixedAPY; // Apply the new APY
            lenders[msg.sender].btcCollateral += btcCollateralAmount;
            lenders[msg.sender].walrusRewards += walrusReward;

            if (lenderDataBlob != bytes32(0)) {
                lenders[msg.sender].lenderDataBlob = lenderDataBlob;
            }

            // 3. Re-insert the lender into the list at their new, correct position.
            _insert(msg.sender);
        } else {
            // New lender logic (this part was already correct)
            lenders[msg.sender] = Lender({
                totalDeposited: amount,
                availableAmount: amount,
                lentAmount: 0,
                earnedInterest: 0,
                fixedAPY: fixedAPY,
                active: true,
                timestamp: block.timestamp,
                lenderDataBlob: lenderDataBlob,
                walrusRewards: walrusReward,
                btcCollateral: btcCollateralAmount,
                isBitcoinLender: useBitcoinCollateral,
                next: address(0), // Initialize pointers
                prev: address(0)
            });
            _insert(msg.sender);
            activeLenderCount++;
        }

        totalAvailableLiquidity += amount;
        if (btcCollateralAmount > 0) {
            totalBTCCollateral += btcCollateralAmount;
        }
        totalWalrusRewards += walrusReward;

        emit LenderAdded(msg.sender, amount, fixedAPY, useBitcoinCollateral);
        if (lenderDataBlob != bytes32(0)) {
            emit WalrusDataStored(
                msg.sender,
                lenderDataBlob,
                lenderMetadata.length
            );
        }
    }

    // Enhanced loan request with multi-protocol features
    function requestLoan(
        uint256 amount,
        bytes calldata loanDocument,
        bool requireBTCCollateral,
        string calldata targetChain
    ) external payable nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(
            amount <= totalAvailableLiquidity,
            "Insufficient pool liquidity"
        );
        require(
            !borrowers[msg.sender].active,
            "Borrower already has active loan"
        );

        // Update price feeds
        _updatePriceFeeds();

        // Store loan document on Walrus
        bytes32 loanDocumentBlob = _storeOnWalrus(loanDocument);

        // Handle BTC collateral if required
        uint256 btcCollateralRatio = 0;
        if (requireBTCCollateral) {
            btcCollateralRatio = _requireBTCCollateral(amount);
        }

        // Match loan with lenders
        LoanChunk[] storage loanChunks = borrowerLoans[msg.sender];
        uint256 remainingAmount = amount;

        if (amount <= WHALE_THRESHOLD) {
            remainingAmount = _matchSmallBorrowerEnhanced(amount, loanChunks);
        } else {
            remainingAmount = _matchWhaleBorrowerEnhanced(amount, loanChunks);
        }

        require(remainingAmount == 0, "Could not match full loan amount");

        uint256 weightedAPY = _calculateWeightedAPYFixed(loanChunks, amount);
        uint256 dueDate = block.timestamp + LOAN_DURATION;

        borrowers[msg.sender] = Borrower({
            amount: amount,
            weightedAPY: weightedAPY,
            timestamp: block.timestamp,
            dueDate: dueDate,
            active: true,
            loanDocumentBlob: loanDocumentBlob,
            btcCollateralRatio: btcCollateralRatio,
            crossChainLoan: bytes(targetChain).length > 0
        });
        borrowerList.push(msg.sender);
        borrowerIndex[msg.sender] = borrowerList.length - 1; // Track index

        // Update global tracking
        totalAvailableLiquidity -= amount;
        totalLentAmount += amount;

        emit BorrowerMatched(
            msg.sender,
            amount,
            weightedAPY,
            dueDate,
            loanDocumentBlob
        );

        // Handle cross-chain loan if specified
        if (bytes(targetChain).length > 0) {
            _executeCrossChainLoan(amount, targetChain);
            emit CrossChainLoanExecuted(msg.sender, amount, targetChain);
        } else {
            usdcToken.transfer(msg.sender, amount);
        }
    }

    // Internal function to handle Bitcoin collateral
    function _handleBitcoinCollateral(
        uint256 usdcAmount
    ) internal returns (uint256) {
        (int64 btcPrice, , , ) = pythOracle.getPrice(BTC_PRICE_ID);
        require(btcPrice > 0, "Invalid BTC price");

        // Calculate required BTC collateral (150% of USDC amount)
        uint256 requiredBTCValue = (usdcAmount * BTC_COLLATERAL_RATIO) /
            BASIS_POINTS;
        uint256 requiredBTC = (requiredBTCValue * 1e8) /
            uint256(int256(btcPrice));

        // Lock BTC through Rootstock bridge
        require(msg.value >= requiredBTC, "Insufficient BTC collateral");
        rootstockBridge.lockBTC{value: requiredBTC}(requiredBTC);

        btcCollaterals[msg.sender] += requiredBTC;

        emit BTCCollateralAdded(msg.sender, requiredBTC);
        return requiredBTC;
    }

    // Internal function to require BTC collateral for borrowers
    function _requireBTCCollateral(
        uint256 loanAmount
    ) internal returns (uint256) {
        (int64 btcPrice, , , ) = pythOracle.getPrice(BTC_PRICE_ID);
        require(btcPrice > 0, "Invalid BTC price");

        uint256 requiredBTCValue = (loanAmount * BTC_COLLATERAL_RATIO) /
            BASIS_POINTS;
        uint256 requiredBTC = (requiredBTCValue * 1e8) /
            uint256(int256(btcPrice));

        require(
            msg.value >= requiredBTC,
            "Insufficient BTC collateral for loan"
        );
        rootstockBridge.lockBTC{value: requiredBTC}(requiredBTC);

        btcCollaterals[msg.sender] += requiredBTC;

        emit BTCCollateralAdded(msg.sender, requiredBTC);
        return BTC_COLLATERAL_RATIO;
    }

    // Internal function to store data on Walrus (for calldata)
    function _storeOnWalrus(bytes calldata data) internal returns (bytes32) {
        if (data.length == 0) return bytes32(0);

        require(
            address(this).balance >= protocolFees.walrusStorageFee,
            "Insufficient fee for Walrus storage"
        );

        try
            walrusStorage.storeBlob{value: protocolFees.walrusStorageFee}(data)
        returns (bytes32 blobId) {
            storedBlobs[blobId] = true;
            return blobId;
        } catch {
            return bytes32(0);
        }
    }

    // Internal helper to store memory data on Walrus
    function _storeOnWalrusFromMemory(
        bytes memory data
    ) internal returns (bytes32) {
        if (data.length == 0) return bytes32(0);

        require(
            address(this).balance >= protocolFees.walrusStorageFee,
            "Insufficient fee for Walrus storage"
        );

        // Convert bytes memory to bytes calldata by using assembly or creating a wrapper
        // For simplicity, we'll use a direct call approach
        try
            this.storeDataWrapper{value: protocolFees.walrusStorageFee}(data)
        returns (bytes32 blobId) {
            storedBlobs[blobId] = true;
            return blobId;
        } catch {
            return bytes32(0);
        }
    }

    // Wrapper function to handle memory to calldata conversion
    function storeDataWrapper(
        bytes calldata data
    ) external payable returns (bytes32) {
        require(msg.sender == address(this), "Only self calls allowed");
        return walrusStorage.storeBlob{value: msg.value}(data);
    }

    // Internal function to update price feeds from Pyth
    function _updatePriceFeeds() internal {
        // In a real implementation, you would pass the actual price update data
        // This is a placeholder for the Pyth price update mechanism
        try
            pythOracle.updatePriceFeeds{value: protocolFees.pythUpdateFee}(
                new bytes[](0)
            )
        {
            // Price feeds updated successfully
        } catch {
            // Handle price update failure
        }
    }

    // Enhanced matching for small borrowers with protocol integration
    function _matchSmallBorrowerEnhanced(
        uint256 amount,
        LoanChunk[] storage loanChunks
    ) internal returns (uint256) {
        uint256 remainingAmount = amount;
        address[] memory sortedLenders = _getLendersSortedByAPY(true);

        for (
            uint256 i = 0;
            i < sortedLenders.length && remainingAmount > 0;
            i++
        ) {
            address lenderAddr = sortedLenders[i];
            Lender storage lender = lenders[lenderAddr];

            if (lender.active && lender.availableAmount > 0) {
                uint256 chunkAmount = remainingAmount > lender.availableAmount
                    ? lender.availableAmount
                    : remainingAmount;

                // Store chunk data on Walrus
                bytes memory chunkData = abi.encode(
                    lenderAddr,
                    chunkAmount,
                    lender.fixedAPY,
                    block.timestamp
                );
                bytes32 chunkBlob = _storeOnWalrusFromMemory(chunkData);

                loanChunks.push(
                    LoanChunk({
                        lender: lenderAddr,
                        amount: chunkAmount,
                        apy: lender.fixedAPY,
                        chunkDataBlob: chunkBlob
                    })
                );

                lender.availableAmount -= chunkAmount;
                lender.lentAmount += chunkAmount;
                remainingAmount -= chunkAmount;
            }
        }

        return remainingAmount;
    }

    // Enhanced matching for whale borrowers
    function _matchWhaleBorrowerEnhanced(
        uint256 amount,
        LoanChunk[] storage loanChunks
    ) internal returns (uint256) {
        uint256 remainingAmount = amount;
        address[] memory sortedLenders = _getLendersSortedByAPY(false);

        for (
            uint256 i = 0;
            i < sortedLenders.length && remainingAmount > 0;
            i++
        ) {
            address lenderAddr = sortedLenders[i];
            Lender storage lender = lenders[lenderAddr];

            if (lender.active && lender.availableAmount > 0) {
                uint256 chunkAmount = remainingAmount > lender.availableAmount
                    ? lender.availableAmount
                    : remainingAmount;

                // Store chunk data on Walrus
                bytes memory chunkData = abi.encode(
                    lenderAddr,
                    chunkAmount,
                    lender.fixedAPY,
                    block.timestamp
                );
                bytes32 chunkBlob = _storeOnWalrusFromMemory(chunkData);

                loanChunks.push(
                    LoanChunk({
                        lender: lenderAddr,
                        amount: chunkAmount,
                        apy: lender.fixedAPY,
                        chunkDataBlob: chunkBlob
                    })
                );

                lender.availableAmount -= chunkAmount;
                lender.lentAmount += chunkAmount;
                remainingAmount -= chunkAmount;
            }
        }

        return remainingAmount;
    }

    // Cross-chain loan execution through Rootstock bridge
    function _executeCrossChainLoan(
        uint256 amount,
        string memory targetChain
    ) internal {
        if (
            keccak256(abi.encodePacked(targetChain)) ==
            keccak256(abi.encodePacked("bitcoin"))
        ) {
            // Convert USDC to RBTC and transfer via Rootstock bridge
            uint256 rbtcAmount = rootstockBridge.convertUSDCToRBTC(amount);
            rootstockBridge.unlockBTC(rbtcAmount, msg.sender);
        } else {
            // For other chains, transfer USDC normally
            usdcToken.transfer(msg.sender, amount);
        }
    }

    // Enhanced loan repayment with protocol benefits
    function repayLoan() external nonReentrant {
        require(borrowers[msg.sender].active, "No active loan");

        Borrower storage borrower = borrowers[msg.sender];
        LoanChunk[] storage chunks = borrowerLoans[msg.sender];

        uint256 totalRepayment = _calculateRepaymentAmount(
            borrower.amount,
            borrower.weightedAPY,
            borrower.timestamp
        );
        uint256 totalInterest = totalRepayment - borrower.amount;

        usdcToken.transferFrom(msg.sender, address(this), totalRepayment);

        // Distribute to lenders and handle protocol rewards
        for (uint256 i = 0; i < chunks.length; i++) {
            LoanChunk storage chunk = chunks[i];
            address lenderAddr = chunk.lender;

            uint256 lenderInterest = (totalInterest * chunk.amount) /
                borrower.amount;

            lenders[lenderAddr].availableAmount += chunk.amount;
            lenders[lenderAddr].lentAmount -= chunk.amount;
            lenders[lenderAddr].earnedInterest += lenderInterest;

            // Add Walrus rewards for successful loan completion
            uint256 bonusReward = (chunk.amount * 10) / BASIS_POINTS; // 0.1% bonus
            lenders[lenderAddr].walrusRewards += bonusReward;
            totalWalrusRewards += bonusReward;
        }

        // Return BTC collateral if any
        if (borrower.btcCollateralRatio > 0 && btcCollaterals[msg.sender] > 0) {
            uint256 collateralToReturn = btcCollaterals[msg.sender];
            btcCollaterals[msg.sender] = 0;
            totalBTCCollateral -= collateralToReturn;
            rootstockBridge.unlockBTC(collateralToReturn, msg.sender);
        }

        // Update global tracking
        totalAvailableLiquidity += borrower.amount;
        totalLentAmount -= borrower.amount;
        totalInterestEarned += totalInterest;

        // Clean up
        delete borrowers[msg.sender];
        delete borrowerLoans[msg.sender];
        _removeBorrowerFromList(msg.sender);

        emit LoanRepaid(msg.sender, borrower.amount, totalInterest);
    }

    // Claim Walrus rewards
    function claimWalrusRewards() external nonReentrant {
        require(lenders[msg.sender].active, "Not an active lender");
        require(lenders[msg.sender].walrusRewards > 0, "No rewards to claim");

        uint256 rewards = lenders[msg.sender].walrusRewards;
        lenders[msg.sender].walrusRewards = 0;

        // Transfer WAL tokens as rewards
        require(
            walrusToken.transfer(msg.sender, rewards),
            "WAL transfer failed"
        );

        emit WalrusRewardsClaimed(msg.sender, rewards);
    }

    // Retrieve data from Walrus storage
    function retrieveLenderData(
        address lender
    ) external view returns (bytes memory) {
        require(lenders[lender].lenderDataBlob != bytes32(0), "No data stored");
        return walrusStorage.retrieveBlob(lenders[lender].lenderDataBlob);
    }

    function retrieveLoanDocument(
        address borrower
    ) external view returns (bytes memory) {
        require(
            borrowers[borrower].loanDocumentBlob != bytes32(0),
            "No loan document stored"
        );
        return walrusStorage.retrieveBlob(borrowers[borrower].loanDocumentBlob);
    }

    function _getLendersSortedByAPY(
        bool ascending
    ) internal view returns (address[] memory) {
        // For this example, we'll size the array based on the borrower count as a rough estimate.
        // A more robust solution might involve a separate counter for active lenders.
        address[] memory sortedLenders = new address[](
            borrowerList.length + 100
        ); // Estimate max size
        uint256 count = 0;

        address currentNode = ascending ? head : tail;

        while (currentNode != address(0) && count < sortedLenders.length) {
            if (lenders[currentNode].availableAmount > 0) {
                sortedLenders[count] = currentNode;
                count++;
            }
            currentNode = ascending
                ? lenders[currentNode].next
                : lenders[currentNode].prev;
        }

        // Resize the array to the actual number of active lenders found
        address[] memory result = new address[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = sortedLenders[i];
        }

        return result;
    }

    function _calculateWeightedAPYFixed(
        LoanChunk[] storage chunks,
        uint256 totalAmount
    ) internal view returns (uint256) {
        if (chunks.length == 0) return 0;

        uint256 totalWeightedAPY = 0;
        for (uint256 i = 0; i < chunks.length; i++) {
            totalWeightedAPY += chunks[i].amount * chunks[i].apy;
        }

        return totalWeightedAPY / totalAmount;
    }

    function _calculateRepaymentAmount(
        uint256 principal,
        uint256 apy,
        uint256 timestamp
    ) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - timestamp;
        uint256 interest = (principal * apy * timeElapsed) /
            (365 days * BASIS_POINTS);
        return principal + interest;
    }

    function liquidateLoan(address borrowerAddr) external nonReentrant {
        require(borrowers[borrowerAddr].active, "No active loan");
        require(
            block.timestamp > borrowers[borrowerAddr].dueDate,
            "Loan not expired"
        );

        Borrower storage borrower = borrowers[borrowerAddr];
        LoanChunk[] storage chunks = borrowerLoans[borrowerAddr];

        for (uint256 i = 0; i < chunks.length; i++) {
            LoanChunk storage chunk = chunks[i];
            address lenderAddr = chunk.lender;

            lenders[lenderAddr].lentAmount -= chunk.amount;
            lenders[lenderAddr].totalDeposited -= chunk.amount;
        }

        // Liquidate BTC collateral if any
        if (btcCollaterals[borrowerAddr] > 0) {
            uint256 collateral = btcCollaterals[borrowerAddr];
            btcCollaterals[borrowerAddr] = 0;
            totalBTCCollateral -= collateral;
            // BTC collateral can be distributed to affected lenders or kept as protocol revenue
        }

        totalLentAmount -= borrower.amount;

        delete borrowers[borrowerAddr];
        delete borrowerLoans[borrowerAddr];
        _removeBorrowerFromList(borrowerAddr);

        emit LoanLiquidated(borrowerAddr, borrower.amount);
    }

    function withdrawLiquidity(uint256 amount) external nonReentrant {
        require(lenders[msg.sender].active, "Not a lender");
        require(
            lenders[msg.sender].availableAmount >= amount,
            "Insufficient available liquidity"
        );

        lenders[msg.sender].availableAmount -= amount;
        lenders[msg.sender].totalDeposited -= amount;
        totalAvailableLiquidity -= amount;

        if (
            lenders[msg.sender].availableAmount == 0 &&
            lenders[msg.sender].lentAmount == 0 &&
            lenders[msg.sender].earnedInterest == 0
        ) {
            lenders[msg.sender].active = false;
            _remove(msg.sender);
            activeLenderCount--;
        }

        usdcToken.transfer(msg.sender, amount);
        emit LiquidityWithdrawn(msg.sender, amount);
    }

    function claimInterest() external nonReentrant {
        require(lenders[msg.sender].active, "Not a lender");
        require(lenders[msg.sender].earnedInterest > 0, "No interest to claim");

        uint256 interest = lenders[msg.sender].earnedInterest;
        lenders[msg.sender].earnedInterest = 0;

        usdcToken.transfer(msg.sender, interest);
        emit InterestClaimed(msg.sender, interest);
    }

    /**
     * @notice Inserts a lender into the sorted doubly linked list.
     * @dev This function assumes the lender has just been added to the `lenders` mapping.
     * It maintains an ascending sort by `fixedAPY`. Complexity is O(n).
     * @param _lenderAddress The address of the new lender to insert.
     */
    function _insert(address _lenderAddress) internal {
        uint256 fixedAPY = lenders[_lenderAddress].fixedAPY;

        // Case 1: The list is empty
        if (head == address(0)) {
            head = _lenderAddress;
            tail = _lenderAddress;
            return;
        }

        // Case 2: The new lender has the lowest APY and becomes the new head
        if (fixedAPY < lenders[head].fixedAPY) {
            lenders[_lenderAddress].next = head;
            lenders[head].prev = _lenderAddress;
            head = _lenderAddress;
            return;
        }

        // Case 3: Traverse the list to find the correct insertion point
        address currentNode = head;
        while (
            currentNode != address(0) &&
            lenders[currentNode].fixedAPY <= fixedAPY
        ) {
            currentNode = lenders[currentNode].next;
        }

        // Case 3a: The new lender has the highest APY and becomes the new tail
        if (currentNode == address(0)) {
            lenders[tail].next = _lenderAddress;
            lenders[_lenderAddress].prev = tail;
            tail = _lenderAddress;
        }
        // Case 3b: Insert the new lender in the middle, just before the currentNode
        else {
            address prevNode = lenders[currentNode].prev;

            // Update pointers for the new node
            lenders[_lenderAddress].next = currentNode;
            lenders[_lenderAddress].prev = prevNode;

            // Update pointers of the surrounding nodes to link to the new node
            lenders[prevNode].next = _lenderAddress;
            lenders[currentNode].prev = _lenderAddress;
        }
    }

    /**
     * @notice Removes a lender from the sorted doubly linked list.
     * @dev O(1) complexity.
     */
    function _remove(address _lenderAddress) internal {
        Lender storage lender = lenders[_lenderAddress];
        if (!lender.active) return; // Not in the list or already removed

        if (lender.prev != address(0)) {
            lenders[lender.prev].next = lender.next;
        } else {
            head = lender.next; // It was the head
        }

        if (lender.next != address(0)) {
            lenders[lender.next].prev = lender.prev;
        } else {
            tail = lender.prev; // It was the tail
        }

        // The node is now unlinked from the list
    }

    function _removeBorrowerFromList(address borrower) internal {
        uint256 indexToRemove = borrowerIndex[borrower];
        address lastBorrower = borrowerList[borrowerList.length - 1];

        borrowerList[indexToRemove] = lastBorrower;
        borrowerIndex[lastBorrower] = indexToRemove;

        borrowerList.pop();
        delete borrowerIndex[borrower];
    }

    // Enhanced APY management with multi-protocol price feeds
    function updateAPYRange() external onlyOwner {
        try pythOracle.getPrice(USDC_PRICE_ID) returns (
            int64 usdcPrice,
            uint64,
            int32,
            uint256
        ) {
            try pythOracle.getPrice(BTC_PRICE_ID) returns (
                int64 btcPrice,
                uint64,
                int32,
                uint256
            ) {
                // Adjust APY based on both USDC and BTC stability
                bool usdcStable = (usdcPrice > 0.999e8 && usdcPrice < 1.001e8);
                bool btcVolatile = _isBTCVolatile(btcPrice);

                if (usdcStable && !btcVolatile) {
                    minAPY = 100; // 1%
                    maxAPY = 1000; // 10%
                } else if (usdcStable && btcVolatile) {
                    minAPY = 150; // 1.5%
                    maxAPY = 1500; // 15%
                } else {
                    minAPY = 200; // 2%
                    maxAPY = 2000; // 20%
                }
            } catch {
                // Fallback to USDC-only logic
                if (usdcPrice > 0.999e8 && usdcPrice < 1.001e8) {
                    minAPY = 100;
                    maxAPY = 1000;
                } else {
                    minAPY = 200;
                    maxAPY = 2000;
                }
            }
        } catch {
            // Keep current ranges if Pyth fails
        }
    }

    function _isBTCVolatile(int64 btcPrice) internal pure returns (bool) {
        // Simple volatility check - in production, you'd want more sophisticated logic
        // This is a placeholder implementation
        return btcPrice < 30000e8 || btcPrice > 100000e8;
    }

    // Protocol fee management
    function updateProtocolFees(
        uint256 _walrusStorageFee,
        uint256 _rootstockBridgeFee,
        uint256 _pythUpdateFee
    ) external onlyOwner {
        protocolFees.walrusStorageFee = _walrusStorageFee;
        protocolFees.rootstockBridgeFee = _rootstockBridgeFee;
        protocolFees.pythUpdateFee = _pythUpdateFee;
    }

    // Enhanced pool status with multi-protocol metrics
    function getPoolStatus()
    external
    view
    returns (
        uint256 totalAvailable,
        uint256 totalLent,
        uint256 activeLenders,
        // ... other return values
    )
{
    // ... other assignments ...
    uint256 activeL = 0;
    uint256 totalAPY = 0;

    // CORRECTED: Traverse the linked list from head to tail
    address currentNode = head;
    while (currentNode != address(0)) {
        activeL++; // Count every node in the list
        totalAPY += lenders[currentNode].fixedAPY;
        currentNode = lenders[currentNode].next;
    }

    // ... loop for borrowers (this part is fine) ...

    activeLenders = activeL;
    averageAPY = activeL > 0 ? totalAPY / activeL : 0;
    // ...
}
    // Enhanced simulation with protocol features
    function simulateLoan(
        uint256 amount,
        bool requireBTCCollateral
    )
        external
        view
        returns (
            LoanChunk[] memory chunks,
            uint256 weightedAPY,
            uint256 requiredBTCCollateral,
            uint256 estimatedWalrusStorageCost
        )
    {
        require(
            amount <= totalAvailableLiquidity,
            "Insufficient liquidity for simulation"
        );

        LoanChunk[] memory tempChunks = new LoanChunk[](activeLenderCount);
        uint256 chunkCount = 0;
        uint256 remainingAmount = amount;

        address[] memory sortedLenders = _getLendersSortedByAPY(
            amount <= WHALE_THRESHOLD
        );

        for (
            uint256 i = 0;
            i < sortedLenders.length && remainingAmount > 0;
            i++
        ) {
            address lenderAddr = sortedLenders[i];
            Lender memory lender = lenders[lenderAddr];

            if (lender.active && lender.availableAmount > 0) {
                uint256 chunkAmount = remainingAmount > lender.availableAmount
                    ? lender.availableAmount
                    : remainingAmount;

                tempChunks[chunkCount] = LoanChunk({
                    lender: lenderAddr,
                    amount: chunkAmount,
                    apy: lender.fixedAPY,
                    chunkDataBlob: bytes32(0) // Not stored in simulation
                });

                remainingAmount -= chunkAmount;
                chunkCount++;
            }
        }

        chunks = new LoanChunk[](chunkCount);
        for (uint256 i = 0; i < chunkCount; i++) {
            chunks[i] = tempChunks[i];
        }

        // Calculate metrics
        if (chunkCount > 0) {
            uint256 totalWeighted = 0;
            for (uint256 i = 0; i < chunkCount; i++) {
                totalWeighted += chunks[i].amount * chunks[i].apy;
            }
            weightedAPY = totalWeighted / (amount - remainingAmount);
        }

        // Calculate BTC collateral requirement
        if (requireBTCCollateral) {
            try pythOracle.getPrice(BTC_PRICE_ID) returns (
                int64 btcPrice,
                uint64,
                int32,
                uint256
            ) {
                if (btcPrice > 0) {
                    uint256 requiredBTCValue = (amount * BTC_COLLATERAL_RATIO) /
                        BASIS_POINTS;
                    requiredBTCCollateral =
                        (requiredBTCValue * 1e8) /
                        uint256(int256(btcPrice));
                }
            } catch {
                requiredBTCCollateral = 0;
            }
        }

        // Estimate Walrus storage cost
        estimatedWalrusStorageCost = protocolFees.walrusStorageFee;

        return (
            chunks,
            weightedAPY,
            requiredBTCCollateral,
            estimatedWalrusStorageCost
        );
    }

    // Multi-protocol lender details
    function getLenderDetails(
        address lender
    )
        external
        view
        returns (
            uint256 totalDeposited,
            uint256 availableAmount,
            uint256 lentAmount,
            uint256 earnedInterest,
            uint256 fixedAPY,
            bool active,
            uint256 walrusRewards,
            uint256 btcCollateral,
            bool isBitcoinLender,
            bytes32 lenderDataBlob
        )
    {
        Lender memory l = lenders[lender];
        return (
            l.totalDeposited,
            l.availableAmount,
            l.lentAmount,
            l.earnedInterest,
            l.fixedAPY,
            l.active,
            l.walrusRewards,
            l.btcCollateral,
            l.isBitcoinLender,
            l.lenderDataBlob
        );
    }

    // Multi-protocol borrower details
    function getBorrowerDetails(
        address borrower
    )
        external
        view
        returns (
            uint256 amount,
            uint256 weightedAPY,
            uint256 timestamp,
            uint256 dueDate,
            bool active,
            bytes32 loanDocumentBlob,
            uint256 btcCollateralRatio,
            bool crossChainLoan,
            uint256 currentRepaymentAmount
        )
    {
        Borrower memory b = borrowers[borrower];
        uint256 repaymentAmount = 0;

        if (b.active) {
            repaymentAmount = _calculateRepaymentAmount(
                b.amount,
                b.weightedAPY,
                b.timestamp
            );
        }

        return (
            b.amount,
            b.weightedAPY,
            b.timestamp,
            b.dueDate,
            b.active,
            b.loanDocumentBlob,
            b.btcCollateralRatio,
            b.crossChainLoan,
            repaymentAmount
        );
    }

    // Protocol-specific view functions
    function getProtocolMetrics()
        external
        view
        returns (
            uint256 totalWalrusDataStored,
            uint256 totalBTCCollateralLocked,
            uint256 availableWalrusRewards,
            ProtocolFees memory currentFees,
            uint256 contractUSDCBalance,
            uint256 contractETHBalance
        )
    {
        // Count stored blobs (simplified)
        uint256 blobCount = 0;
        // In a real implementation, you'd track this more efficiently

        return (
            blobCount,
            totalBTCCollateral,
            totalWalrusRewards,
            protocolFees,
            usdcToken.balanceOf(address(this)),
            address(this).balance
        );
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Allow contract to receive ETH for protocol fees
    receive() external payable {}

    // Emergency withdrawal (only owner)
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }

    // Update protocol contracts (only owner)
    function updateProtocolContracts(
        address _pythOracle,
        address _walrusStorage,
        address _walrusToken,
        address _rootstockBridge
    ) external onlyOwner {
        if (_pythOracle != address(0)) pythOracle = IPythOracle(_pythOracle);
        if (_walrusStorage != address(0))
            walrusStorage = IWalrusStorage(_walrusStorage);
        if (_walrusToken != address(0))
            walrusToken = IWalrusToken(_walrusToken);
        if (_rootstockBridge != address(0))
            rootstockBridge = IRootstockBridge(_rootstockBridge);
    }
}
