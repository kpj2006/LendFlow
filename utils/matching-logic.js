// Orderbook matching algorithms for the lending protocol

/**
 * Matches a small borrower (amount < whale threshold) with lenders
 * Small borrowers are matched from lowest APY to highest APY
 */
export function matchSmallBorrower(amount, lenders) {
  const WHALE_THRESHOLD = 1000 * 10**6 // 1000 USDC in wei
  
  if (amount >= WHALE_THRESHOLD) {
    throw new Error('Amount exceeds small borrower threshold')
  }

  // Sort lenders by APY (ascending - lowest first)
  const sortedLenders = [...lenders].sort((a, b) => a.fixedAPY - b.fixedAPY)
  
  const matches = []
  let remainingAmount = amount
  
  for (const lender of sortedLenders) {
    if (remainingAmount <= 0) break
    if (!lender.active || lender.amount <= 0) continue
    
    const chunkAmount = Math.min(remainingAmount, lender.amount)
    
    matches.push({
      lender: lender.address,
      amount: chunkAmount,
      apy: lender.fixedAPY
    })
    
    remainingAmount -= chunkAmount
  }
  
  return {
    matches,
    remainingAmount,
    fullyMatched: remainingAmount === 0
  }
}

/**
 * Matches a whale borrower (amount >= whale threshold) with lenders
 * Whale borrowers are matched from highest APY to lowest APY
 */
export function matchWhaleBorrower(amount, lenders) {
  const WHALE_THRESHOLD = 1000 * 10**6 // 1000 USDC in wei
  
  if (amount < WHALE_THRESHOLD) {
    throw new Error('Amount below whale borrower threshold')
  }

  // Sort lenders by APY (descending - highest first)
  const sortedLenders = [...lenders].sort((a, b) => b.fixedAPY - a.fixedAPY)
  
  const matches = []
  let remainingAmount = amount
  
  for (const lender of sortedLenders) {
    if (remainingAmount <= 0) break
    if (!lender.active || lender.amount <= 0) continue
    
    const chunkAmount = Math.min(remainingAmount, lender.amount)
    
    matches.push({
      lender: lender.address,
      amount: chunkAmount,
      apy: lender.fixedAPY
    })
    
    remainingAmount -= chunkAmount
  }
  
  return {
    matches,
    remainingAmount,
    fullyMatched: remainingAmount === 0
  }
}

/**
 * Calculates weighted average APY for a set of loan chunks
 */
export function calculateWeightedAPY(chunks, totalAmount) {
  if (!chunks || chunks.length === 0) return 0
  
  const totalWeightedAPY = chunks.reduce((sum, chunk) => {
    return sum + (chunk.amount * chunk.apy)
  }, 0)
  
  return Math.floor(totalWeightedAPY / totalAmount)
}

/**
 * Determines if a borrower is a whale based on amount
 */
export function isWhaleBorrower(amount) {
  const WHALE_THRESHOLD = 1000 * 10**6 // 1000 USDC in wei
  return amount >= WHALE_THRESHOLD
}

/**
 * Main matching function that routes to appropriate algorithm
 */
export function matchBorrower(amount, lenders) {
  const isWhale = isWhaleBorrower(amount)
  
  if (isWhale) {
    return matchWhaleBorrower(amount, lenders)
  } else {
    return matchSmallBorrower(amount, lenders)
  }
}

/**
 * Simulates the matching process for visualization
 */
export function simulateMatching(borrowerAmount, lenders, borrowerType = 'auto') {
  const isWhale = borrowerType === 'whale' || isWhaleBorrower(borrowerAmount)
  
  const result = isWhale 
    ? matchWhaleBorrower(borrowerAmount, lenders)
    : matchSmallBorrower(borrowerAmount, lenders)
  
  const weightedAPY = calculateWeightedAPY(result.matches, borrowerAmount)
  
  return {
    ...result,
    weightedAPY,
    borrowerType: isWhale ? 'whale' : 'small',
    totalMatched: borrowerAmount - result.remainingAmount
  }
}

/**
 * Validates matching parameters
 */
export function validateMatchingParams(amount, lenders) {
  const errors = []
  
  if (!amount || amount <= 0) {
    errors.push('Amount must be greater than 0')
  }
  
  if (!lenders || !Array.isArray(lenders)) {
    errors.push('Lenders must be an array')
  }
  
  if (lenders && lenders.length === 0) {
    errors.push('No lenders available')
  }
  
  const totalLiquidity = lenders?.reduce((sum, lender) => {
    return sum + (lender.active ? lender.amount : 0)
  }, 0) || 0
  
  if (amount > totalLiquidity) {
    errors.push('Insufficient liquidity in pool')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Gets optimal APY range based on current market conditions
 */
export function getOptimalAPYRange(pythAPY, volatility = 0.1) {
  const baseAPY = Number(pythAPY)
  const range = Math.floor(baseAPY * volatility)
  
  return {
    min: Math.max(100, baseAPY - range), // Minimum 1%
    max: Math.min(5000, baseAPY + range), // Maximum 50%
    optimal: baseAPY,
    range
  }
}

/**
 * Calculates interest for a loan
 */
export function calculateInterest(principal, apy, timeElapsed) {
  const BASIS_POINTS = 10000
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
  
  const interest = (principal * apy * timeElapsed) / (SECONDS_PER_YEAR * BASIS_POINTS)
  return Math.floor(interest)
}

/**
 * Formats APY for display
 */
export function formatAPY(apy) {
  return `${(Number(apy) / 100).toFixed(2)}%`
}

/**
 * Formats USDC amount for display
 */
export function formatUSDC(amount) {
  return (Number(amount) / 10**6).toFixed(2)
}
