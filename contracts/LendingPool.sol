// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

// Rootstock Bridge Interface for Bitcoin integration
interface IRootstockBridge {
    function lockBTC(uint256 amount) external payable;
    function unlockBTC(uint256 amount, address recipient) external;
    function getBTCBalance(address user) external view returns (uint256);
    function convertRBTCToUSDC(uint256 rbtcAmount) external returns (uint256 usdcAmount);
    function convertUSDCToRBTC(uint256 usdcAmount) external returns (uint256 rbtcAmount);
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
    function getReserveData(address asset) external view returns (
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
    IERC20 public immutable cethToken;  // Collateral token (cETH)
    
    // Protocol integrations
    IRootstockBridge public rootstockBridge;
    IPot public pot;  // MakerDAO Pot contract for DSR
    IAaveV3Pool public aavePool;  // Aave v3 Pool contract
    
    // Stable APY state variables (using ray math - 1e27)
    uint256 public smoothedAPY;  // EWMA smoothed hybrid APY
    uint256 public lastUpdateTime;  // Last time APY was updated
    uint256 public constant EWMA_ALPHA = 100000000000000000;  // 0.1 in ray (1e26)
    uint256 public constant RAY = 1e27;  // Ray unit for fixed-point math
    uint256 public constant SECONDS_PER_YEAR = 31536000;  // Seconds in a year
    
    struct Lender {
        uint256 totalDeposited;
        uint256 availableAmount;
        uint256 lentAmount;
        uint256 earnedInterest;
        uint256 fixedAPY;
        bool active;
        uint256 timestamp;
    }
    
    struct Borrower {
        uint256 amount;              // USDC borrowed amount
        uint256 collateralAmount;   // cETH collateral deposited
        uint256 weightedAPY;
        uint256 timestamp;
        uint256 dueDate;
        bool active;
        // Multi-protocol data
        bool crossChainLoan;       // Flag for cross-chain loan
    }
    
    struct LoanChunk {
        address lender;
        uint256 amount;
        uint256 apy;
    }

    struct ProtocolFees {
        uint256 rootstockBridgeFee;  // Fee for Rootstock bridge operations
    }
    
    // State variables
    mapping(address => Lender) public lenders;
    mapping(address => Borrower) public borrowers;
    mapping(address => LoanChunk[]) public borrowerLoans;
    
    address[] public lenderList;
    address[] public borrowerList;
    
    // Protocol tracking
    uint256 public totalAvailableLiquidity;
    uint256 public totalLentAmount;
    uint256 public totalInterestEarned;
    
    ProtocolFees public protocolFees;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant LOAN_DURATION = 30 days;
    uint256 public constant COLLATERAL_RATIO = 15000; // 150% collateral ratio (150 * 100)
    uint256 public constant APY_DELTA = 20; // 0.2% delta (0.002 * 10000 basis points)
    
    // Events
    event LenderAdded(address indexed lender, uint256 amount, uint256 apy);
    event BorrowerMatched(address indexed borrower, uint256 amount, uint256 collateral, uint256 weightedAPY, uint256 dueDate);
    event LoanRepaid(address indexed borrower, uint256 principal, uint256 interest);
    event LoanLiquidated(address indexed borrower, uint256 amount, uint256 collateralSeized);
    event LiquidityWithdrawn(address indexed lender, uint256 amount);
    event InterestClaimed(address indexed lender, uint256 interest);
    event CrossChainLoanExecuted(address indexed borrower, uint256 amount, string targetChain);
    event CollateralDeposited(address indexed borrower, uint256 collateralAmount);
    event CollateralWithdrawn(address indexed borrower, uint256 collateralAmount);
    
    constructor(
        address _usdcToken,
        address _cethToken,
        address _rootstockBridge,
        address _makerPot,
        address _aavePool
    ) {
        usdcToken = IERC20(_usdcToken);
        cethToken = IERC20(_cethToken);
        rootstockBridge = IRootstockBridge(_rootstockBridge);
        pot = IPot(_makerPot);
        aavePool = IAaveV3Pool(_aavePool);
        
        // Initialize protocol fees
        protocolFees = ProtocolFees({
            rootstockBridgeFee: 5000    // 0.05 USDC
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
        require(y == 0 || (z = x * y) / y == x, "RayMath: multiplication overflow");
    }
    
    /// @notice Multiply ray number by a fraction (numerator/denominator) in ray
    function rmul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = mul(x, y) / RAY;
    }
    
    /// @notice Power function for annualizing rates: rpow(dsr, secondsPerYear, 1e27)
    /// @dev For DSR annualization: (1 + dsr/RAY)^secondsPerYear
    function rpow(uint256 x, uint256 n, uint256 base) internal pure returns (uint256 z) {
        // DSR is a continuous rate in ray. For annualization:
        // annualRate = (1 + dsr/RAY)^secondsPerYear
        
        if (x == 0) return n == 0 ? base : 0;
        
        // Approximate (1 + r)^n using first-order Taylor expansion
        // For small r (DSR close to 0), (1 + r)^n ≈ 1 + n*r
        // But DSR is in ray, so r = (dsr - RAY) / RAY
        
        uint256 r = x > RAY ? (x - RAY) * RAY / x : 0; // Avoid underflow
        uint256 annualRate = RAY + (n * r) / RAY;
        
        return annualRate;
    }
    
    // ===== STABLE APY INTEGRATION =====
    
    /// @notice Fetch MakerDAO DSR (Dai Savings Rate) - already annualized
    /// @return Annualized DSR in ray format (1e27 = 100%)
    function _fetchMakerDSR() internal returns (uint256) {
        // Call drip() to sync chi with latest accrued interest
        pot.drip();
        
        // Get current DSR (already annualized at 5% APY in ray format)
        uint256 dsr = pot.dsr();
        
        // MockMakerPot now returns annualized rate directly
        return dsr;
    }
    
    /// @notice Fetch Aave v3 USDC supply APY
    /// @return Supply APY in ray format (already annualized by Aave)
    function _fetchAaveSupplyAPY() internal view returns (uint256) {
        // Get reserve data for USDC (assuming USDC address is known)
        // Note: In production, you'd pass the actual USDC address
        address usdcAddress = address(usdcToken);
        (, , uint256 currentLiquidityRate, , , , , , , , , , , , ) = aavePool.getReserveData(usdcAddress);
        
        // currentLiquidityRate is already in ray format (1e27) and annualized
        // No additional annualization needed
        return currentLiquidityRate;
    }
    
    /// @notice Compute hybrid APY using weighted average of MakerDAO and Aave rates
    /// @return Hybrid APY in ray format
    function _computeHybridAPY(uint256 makerAPY, uint256 aaveAPY) internal pure returns (uint256) {
        // stableAPY = 0.7 * makerAPY + 0.3 * aaveAPY
        // Using ray math: rmul(0.7 * RAY, makerAPY) + rmul(0.3 * RAY, aaveAPY)
        
        uint256 makerWeight = 7 * RAY / 10;  // 0.7 in ray
        uint256 aaveWeight = 3 * RAY / 10;   // 0.3 in ray
        
        uint256 weightedMaker = rmul(makerWeight, makerAPY);
        uint256 weightedAave = rmul(aaveWeight, aaveAPY);
        
        return add(weightedMaker, weightedAave);
    }
    
    /// @notice Apply EWMA smoothing to prevent sudden APY spikes
    /// @param currentAPY The newly computed hybrid APY
    /// @return Smoothed APY using exponential weighted moving average
    function _applyEWMASmoothing(uint256 currentAPY) internal view returns (uint256) {
        // smoothedAPY = alpha * currentAPY + (1 - alpha) * previousSmoothedAPY
        // alpha = 0.1 (10% weight to new value, 90% to previous)
        
        if (smoothedAPY == 0) {
            // First time - no previous value, return current
            return currentAPY;
        }
        
        uint256 alpha = EWMA_ALPHA;           // 0.1 in ray
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
    
    /// @notice Get minimum allowed APY (stableAPY - 0.2%)
    /// @return Minimum APY in basis points
    function getMinAPY() public view returns (uint256) {
        if (smoothedAPY == 0) return 100; // Fallback to 1% if not initialized
        
        // Convert ray to basis points: smoothedAPY / RAY * BASIS_POINTS
        uint256 stableAPYBasisPoints = (smoothedAPY * BASIS_POINTS) / RAY;
        
        // Ensure we don't go below 0.1% (10 basis points)
        if (stableAPYBasisPoints <= APY_DELTA + 10) {
            return 10;
        }
        
        return stableAPYBasisPoints - APY_DELTA;
    }
    
    /// @notice Get maximum allowed APY (stableAPY + 0.2%)
    /// @return Maximum APY in basis points
    function getMaxAPY() public view returns (uint256) {
        if (smoothedAPY == 0) return 2000; // Fallback to 20% if not initialized
        
        // Convert ray to basis points: smoothedAPY / RAY * BASIS_POINTS
        uint256 stableAPYBasisPoints = (smoothedAPY * BASIS_POINTS) / RAY;
        
        // Cap at reasonable maximum (50%)
        uint256 maxAllowed = stableAPYBasisPoints + APY_DELTA;
        return maxAllowed > 5000 ? 5000 : maxAllowed;
    }
    
    // Enhanced liquidity addition with multi-protocol support
    function addLiquidity(
        uint256 amount, 
        uint256 fixedAPY, 
        bytes calldata lenderMetadata
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 minAllowedAPY = getMinAPY();
        uint256 maxAllowedAPY = getMaxAPY();
        require(fixedAPY >= minAllowedAPY && fixedAPY <= maxAllowedAPY, 
               string(abi.encodePacked("APY must be between ", 
                      _toString(minAllowedAPY), " and ", _toString(maxAllowedAPY))));
        
        usdcToken.transferFrom(msg.sender, address(this), amount);
        
        if (lenders[msg.sender].active) {
            // Update existing lender
            lenders[msg.sender].totalDeposited += amount;
            lenders[msg.sender].availableAmount += amount;
            lenders[msg.sender].fixedAPY = fixedAPY;
        } else {
            // New lender
            lenders[msg.sender] = Lender({
                totalDeposited: amount,
                availableAmount: amount,
                lentAmount: 0,
                earnedInterest: 0,
                fixedAPY: fixedAPY,
                active: true,
                timestamp: block.timestamp
            });
            lenderList.push(msg.sender);
        }
        
        totalAvailableLiquidity += amount;
        
        emit LenderAdded(msg.sender, amount, fixedAPY);
    }
    
    // Enhanced loan request with collateral system
    function requestLoan(
        uint256 amount,
        uint256 collateralAmount,
        bytes calldata loanDocument,
        string calldata targetChain
    ) external payable nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= totalAvailableLiquidity, "Insufficient pool liquidity");
        require(!borrowers[msg.sender].active, "Borrower already has active loan");
        
        // Calculate required collateral (150% of loan amount)
        // 1 USDC = 1 cETH, so we need 1.5 cETH per 1 USDC borrowed
        uint256 requiredCollateral = (amount * COLLATERAL_RATIO) / BASIS_POINTS;
        require(collateralAmount >= requiredCollateral, "Insufficient collateral provided");
        
        // Transfer collateral from borrower
        cethToken.transferFrom(msg.sender, address(this), collateralAmount);
        
        // Match loan with lenders
        LoanChunk[] storage loanChunks = borrowerLoans[msg.sender];
        uint256 remainingAmount = amount;
        
        // --- NEW DYNAMIC BORROWER CLASSIFICATION ---
    // Calculate the threshold as 5% of the current available liquidity.
    uint256 dynamicThreshold = (totalAvailableLiquidity * 5) / 100;
        
        // Determine matching strategy based on the loan's size relative to the pool.
    if (amount <= dynamicThreshold) {
        // Loan is 5% or less of the pool -> considered "small".
        // Match with the cheapest lenders first.
        remainingAmount = _matchSmallBorrowerEnhanced(amount, loanChunks);
    } else {
        // Loan is more than 5% of the pool -> considered "big".
        // Match with the most expensive (eager) lenders first to ensure it gets filled.
        remainingAmount = _matchWhaleBorrowerEnhanced(amount, loanChunks);
    }
        require(remainingAmount == 0, "Could not match full loan amount");
        
        uint256 weightedAPY = _calculateWeightedAPYFixed(loanChunks, amount);
        uint256 dueDate = block.timestamp + LOAN_DURATION;
        
        borrowers[msg.sender] = Borrower({
            amount: amount,
            collateralAmount: collateralAmount,
            weightedAPY: weightedAPY,
            timestamp: block.timestamp,
            dueDate: dueDate,
            active: true,
            crossChainLoan: bytes(targetChain).length > 0
        });
        borrowerList.push(msg.sender);
        
        // Update global tracking
        totalAvailableLiquidity -= amount;
        totalLentAmount += amount;
        
        emit CollateralDeposited(msg.sender, collateralAmount);
        
        emit BorrowerMatched(msg.sender, amount, collateralAmount, weightedAPY, dueDate);
        
        // Handle cross-chain loan if specified
        if (bytes(targetChain).length > 0) {
            _executeCrossChainLoan(amount, targetChain);
            emit CrossChainLoanExecuted(msg.sender, amount, targetChain);
        } else {
            usdcToken.transfer(msg.sender, amount);
        }
    }
    
    // Internal helper to store memory data on Walrus
    function _storeOnWalrusFromMemory(bytes memory data) internal returns (bytes32) {
        // Walrus integration moved to off-chain HTTP API
        return bytes32(0);
    }
    
    // Enhanced matching for small borrowers with protocol integration
    function _matchSmallBorrowerEnhanced(uint256 amount, LoanChunk[] storage loanChunks) internal returns (uint256) {
        uint256 remainingAmount = amount;
        address[] memory sortedLenders = _getLendersSortedByAPY(true);
        
        for (uint256 i = 0; i < sortedLenders.length && remainingAmount > 0; i++) {
            address lenderAddr = sortedLenders[i];
            Lender storage lender = lenders[lenderAddr];
            
            if (lender.active && lender.availableAmount > 0) {
                uint256 chunkAmount = remainingAmount > lender.availableAmount ? lender.availableAmount : remainingAmount;
                
                loanChunks.push(LoanChunk({
                    lender: lenderAddr,
                    amount: chunkAmount,
                    apy: lender.fixedAPY
                }));
                
                lender.availableAmount -= chunkAmount;
                lender.lentAmount += chunkAmount;
                remainingAmount -= chunkAmount;
            }
        }
        
        return remainingAmount;
    }
    
    // Enhanced matching for whale borrowers
    function _matchWhaleBorrowerEnhanced(uint256 amount, LoanChunk[] storage loanChunks) internal returns (uint256) {
        uint256 remainingAmount = amount;
        address[] memory sortedLenders = _getLendersSortedByAPY(false);
        
        for (uint256 i = 0; i < sortedLenders.length && remainingAmount > 0; i++) {
            address lenderAddr = sortedLenders[i];
            Lender storage lender = lenders[lenderAddr];
            
            if (lender.active && lender.availableAmount > 0) {
                uint256 chunkAmount = remainingAmount > lender.availableAmount ? lender.availableAmount : remainingAmount;
                
                loanChunks.push(LoanChunk({
                    lender: lenderAddr,
                    amount: chunkAmount,
                    apy: lender.fixedAPY
                }));
                
                lender.availableAmount -= chunkAmount;
                lender.lentAmount += chunkAmount;
                remainingAmount -= chunkAmount;
            }
        }
        
        return remainingAmount;
    }
    
    // Cross-chain loan execution through Rootstock bridge
    function _executeCrossChainLoan(uint256 amount, string memory targetChain) internal {
        if (keccak256(abi.encodePacked(targetChain)) == keccak256(abi.encodePacked("bitcoin"))) {
            // Convert USDC to RBTC and transfer via Rootstock bridge
            uint256 rbtcAmount = rootstockBridge.convertUSDCToRBTC(amount);
            rootstockBridge.unlockBTC(rbtcAmount, msg.sender);
        } else {
            // For other chains, transfer USDC normally
            usdcToken.transfer(msg.sender, amount);
        }
    }
    
    // Enhanced loan repayment with collateral return
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
        
        // Return collateral to borrower
        cethToken.transfer(msg.sender, borrower.collateralAmount);
        emit CollateralWithdrawn(msg.sender, borrower.collateralAmount);
        
        // Distribute to lenders and handle protocol rewards
        for (uint256 i = 0; i < chunks.length; i++) {
            LoanChunk storage chunk = chunks[i];
            address lenderAddr = chunk.lender;
            
            uint256 lenderInterest = (totalInterest * chunk.amount) / borrower.amount;
            
            lenders[lenderAddr].availableAmount += chunk.amount;
            lenders[lenderAddr].lentAmount -= chunk.amount;
            lenders[lenderAddr].earnedInterest += lenderInterest;
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
    
    // Keep all existing functions from original contract
    function _getLendersSortedByAPY(bool ascending) internal view returns (address[] memory) {
        uint256 activeLenderCount = 0;
        for (uint256 i = 0; i < lenderList.length; i++) {
            if (lenders[lenderList[i]].active && lenders[lenderList[i]].availableAmount > 0) {
                activeLenderCount++;
            }
        }
        
        address[] memory activeLenders = new address[](activeLenderCount);
        uint256 index = 0;
        for (uint256 i = 0; i < lenderList.length; i++) {
            if (lenders[lenderList[i]].active && lenders[lenderList[i]].availableAmount > 0) {
                activeLenders[index] = lenderList[i];
                index++;
            }
        }
        
        for (uint256 i = 0; i < activeLenderCount; i++) {
            for (uint256 j = 0; j < activeLenderCount - i - 1; j++) {
                bool shouldSwap = ascending 
                    ? lenders[activeLenders[j]].fixedAPY > lenders[activeLenders[j + 1]].fixedAPY
                    : lenders[activeLenders[j]].fixedAPY < lenders[activeLenders[j + 1]].fixedAPY;
                
                if (shouldSwap) {
                    address temp = activeLenders[j];
                    activeLenders[j] = activeLenders[j + 1];
                    activeLenders[j + 1] = temp;
                }
            }
        }
        
        return activeLenders;
    }
    
    function _calculateWeightedAPYFixed(LoanChunk[] storage chunks, uint256 totalAmount) internal view returns (uint256) {
        if (chunks.length == 0) return 0;
        
        uint256 totalWeightedAPY = 0;
        for (uint256 i = 0; i < chunks.length; i++) {
            totalWeightedAPY += chunks[i].amount * chunks[i].apy;
        }
        
        return totalWeightedAPY / totalAmount;
    }
    
    function _calculateRepaymentAmount(uint256 principal, uint256 apy, uint256 timestamp) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - timestamp;
        uint256 interest = (principal * apy * timeElapsed) / (365 days * BASIS_POINTS);
        return principal + interest;
    }
    
    function liquidateLoan(address borrowerAddr) external nonReentrant {
        require(borrowers[borrowerAddr].active, "No active loan");
        require(block.timestamp > borrowers[borrowerAddr].dueDate, "Loan not expired");
        
        Borrower storage borrower = borrowers[borrowerAddr];
        LoanChunk[] storage chunks = borrowerLoans[borrowerAddr];
        
        // Seize collateral and distribute to lenders
        uint256 collateralSeized = borrower.collateralAmount;
        
        for (uint256 i = 0; i < chunks.length; i++) {
            LoanChunk storage chunk = chunks[i];
            address lenderAddr = chunk.lender;
            
            lenders[lenderAddr].lentAmount -= chunk.amount;
            lenders[lenderAddr].totalDeposited -= chunk.amount;
            
            // Distribute collateral proportionally to lenders
            uint256 lenderCollateralShare = (collateralSeized * chunk.amount) / borrower.amount;
            cethToken.transfer(lenderAddr, lenderCollateralShare);
        }
        
        totalLentAmount -= borrower.amount;
        
        delete borrowers[borrowerAddr];
        delete borrowerLoans[borrowerAddr];
        _removeBorrowerFromList(borrowerAddr);
        
        emit LoanLiquidated(borrowerAddr, borrower.amount, collateralSeized);
    }
    
    function withdrawLiquidity(uint256 amount) external nonReentrant {
        require(lenders[msg.sender].active, "Not a lender");
        require(lenders[msg.sender].availableAmount >= amount, "Insufficient available liquidity");
        
        lenders[msg.sender].availableAmount -= amount;
        lenders[msg.sender].totalDeposited -= amount;
        totalAvailableLiquidity -= amount;
        
        if (lenders[msg.sender].availableAmount == 0 && 
            lenders[msg.sender].lentAmount == 0 && 
            lenders[msg.sender].earnedInterest == 0) {
            lenders[msg.sender].active = false;
            _removeLenderFromList(msg.sender);
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
    
    function _removeLenderFromList(address lender) internal {
        for (uint256 i = 0; i < lenderList.length; i++) {
            if (lenderList[i] == lender) {
                lenderList[i] = lenderList[lenderList.length - 1];
                lenderList.pop();
                break;
            }
        }
    }
    
    function _removeBorrowerFromList(address borrower) internal {
        for (uint256 i = 0; i < borrowerList.length; i++) {
            if (borrowerList[i] == borrower) {
                borrowerList[i] = borrowerList[borrowerList.length - 1];
                borrowerList.pop();
                break;
            }
        }
    }
    
    // Protocol fee management
    function updateProtocolFees(
        uint256 _rootstockBridgeFee
    ) external onlyOwner {
        protocolFees.rootstockBridgeFee = _rootstockBridgeFee;
    }
    
    // Enhanced pool status with multi-protocol metrics
    function getPoolStatus() external view returns (
        uint256 totalAvailable,
        uint256 totalLent,
        uint256 activeLenders,
        uint256 activeBorrowers,
        uint256 averageAPY,
        uint256 totalInterest,
        uint256 crossChainLoans
    ) {
        totalAvailable = totalAvailableLiquidity;
        totalLent = totalLentAmount;
        totalInterest = totalInterestEarned;
        
        uint256 activeL = 0;
        uint256 activeB = 0;
        uint256 crossChain = 0;
        uint256 totalAPY = 0;
        
        for (uint256 i = 0; i < lenderList.length; i++) {
            if (lenders[lenderList[i]].active) {
                activeL++;
                totalAPY += lenders[lenderList[i]].fixedAPY;
            }
        }
        
        for (uint256 i = 0; i < borrowerList.length; i++) {
            if (borrowers[borrowerList[i]].active) {
                activeB++;
                if (borrowers[borrowerList[i]].crossChainLoan) {
                    crossChain++;
                }
            }
        }
        
        activeLenders = activeL;
        activeBorrowers = activeB;
        crossChainLoans = crossChain;
        averageAPY = activeL > 0 ? totalAPY / activeL : 0;
        
        return (totalAvailable, totalLent, activeLenders, activeBorrowers, averageAPY, totalInterest, crossChainLoans);
    }
    
    // Enhanced simulation with protocol features
    function simulateLoan(uint256 amount) external view returns (
        LoanChunk[] memory chunks,
        uint256 weightedAPY,
        uint256 estimatedWalrusStorageCost
       
    ) {
        require(amount <= totalAvailableLiquidity, "Insufficient liquidity for simulation");
         uint256 dynamicThreshold = (totalAvailableLiquidity * 5) / 100;
        LoanChunk[] memory tempChunks = new LoanChunk[](lenderList.length);
        uint256 chunkCount = 0;
        uint256 remainingAmount = amount;
        
        address[] memory sortedLenders = _getLendersSortedByAPY(amount <= dynamicThreshold);
        
        for (uint256 i = 0; i < sortedLenders.length && remainingAmount > 0; i++) {
            address lenderAddr = sortedLenders[i];
            Lender memory lender = lenders[lenderAddr];
            
            if (lender.active && lender.availableAmount > 0) {
                uint256 chunkAmount = remainingAmount > lender.availableAmount ? lender.availableAmount : remainingAmount;
                
                tempChunks[chunkCount] = LoanChunk({
                    lender: lenderAddr,
                    amount: chunkAmount,
                    apy: lender.fixedAPY
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
        
        // Estimate Walrus storage cost (now off-chain, so 0)
        estimatedWalrusStorageCost = 0;
        
        return (chunks, weightedAPY, estimatedWalrusStorageCost);
    }
    
    // Multi-protocol lender details
    function getLenderDetails(address lender) external view returns (
        uint256 totalDeposited,
        uint256 availableAmount,
        uint256 lentAmount,
        uint256 earnedInterest,
        uint256 fixedAPY,
        bool active
    ) {
        Lender memory l = lenders[lender];
        return (
            l.totalDeposited,
            l.availableAmount,
            l.lentAmount,
            l.earnedInterest,
            l.fixedAPY,
            l.active
        );
    }
    
    // Multi-protocol borrower details
    function getBorrowerDetails(address borrower) external view returns (
        uint256 amount,
        uint256 collateralAmount,
        uint256 weightedAPY,
        uint256 timestamp,
        uint256 dueDate,
        bool active,
        bool crossChainLoan,
        uint256 currentRepaymentAmount
    ) {
        Borrower memory b = borrowers[borrower];
        uint256 repaymentAmount = 0;
        
        if (b.active) {
            repaymentAmount = _calculateRepaymentAmount(b.amount, b.weightedAPY, b.timestamp);
        }
        
        return (
            b.amount,
            b.collateralAmount,
            b.weightedAPY,
            b.timestamp,
            b.dueDate,
            b.active,
            b.crossChainLoan,
            repaymentAmount
        );
    }
    
    // Protocol-specific view functions
    function getProtocolMetrics() external view returns (
        uint256 totalWalrusDataStored,
        uint256 totalBTCCollateralLocked,
        ProtocolFees memory currentFees,
        uint256 contractUSDCBalance,
        uint256 contractETHBalance
    ) {
        // Count stored blobs (simplified)
        uint256 blobCount = 0;
        // In a real implementation, you'd track this more efficiently
        
        return (
            blobCount,
            0, // BTC collateral removed
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
    
    // Helper function to convert uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // Allow contract to receive ETH for protocol fees
    receive() external payable {}
    
    // Emergency withdrawal (only owner)
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    // Update protocol contracts (only owner)
    function updateProtocolContracts(
        address _rootstockBridge
    ) external onlyOwner {
        if (_rootstockBridge != address(0)) rootstockBridge = IRootstockBridge(_rootstockBridge);
    }
}