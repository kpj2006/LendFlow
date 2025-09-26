// APY calculation utilities for the lending protocol

/**
 * Calculates weighted average APY for multiple loan chunks
 */
export function calculateWeightedAverageAPY(chunks) {
  if (!chunks || chunks.length === 0) return 0
  
  const totalAmount = chunks.reduce((sum, chunk) => sum + chunk.amount, 0)
  const totalWeightedAPY = chunks.reduce((sum, chunk) => {
    return sum + (chunk.amount * chunk.apy)
  }, 0)
  
  return Math.floor(totalWeightedAPY / totalAmount)
}

/**
 * Calculates compound interest for a given period
 */
export function calculateCompoundInterest(principal, apy, timeElapsed, compoundingFrequency = 365) {
  const BASIS_POINTS = 10000
  const rate = apy / BASIS_POINTS
  const periods = (timeElapsed / (365 * 24 * 60 * 60)) * compoundingFrequency
  
  const amount = principal * Math.pow(1 + (rate / compoundingFrequency), periods)
  return Math.floor(amount - principal)
}

/**
 * Calculates simple interest for a given period
 */
export function calculateSimpleInterest(principal, apy, timeElapsed) {
  const BASIS_POINTS = 10000
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
  
  const interest = (principal * apy * timeElapsed) / (SECONDS_PER_YEAR * BASIS_POINTS)
  return Math.floor(interest)
}

/**
 * Calculates effective APY based on compounding
 */
export function calculateEffectiveAPY(nominalAPY, compoundingFrequency = 365) {
  const BASIS_POINTS = 10000
  const rate = nominalAPY / BASIS_POINTS
  
  const effectiveRate = Math.pow(1 + (rate / compoundingFrequency), compoundingFrequency) - 1
  return Math.floor(effectiveRate * BASIS_POINTS)
}

/**
 * Calculates APY from interest rate and time period
 */
export function calculateAPYFromInterest(principal, interest, timeElapsed) {
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
  const BASIS_POINTS = 10000
  
  if (principal === 0 || timeElapsed === 0) return 0
  
  const rate = (interest * SECONDS_PER_YEAR) / (principal * timeElapsed)
  return Math.floor(rate * BASIS_POINTS)
}

/**
 * Calculates total repayment amount including interest
 */
export function calculateTotalRepayment(principal, apy, timeElapsed, interestType = 'simple') {
  const interest = interestType === 'compound' 
    ? calculateCompoundInterest(principal, apy, timeElapsed)
    : calculateSimpleInterest(principal, apy, timeElapsed)
  
  return principal + interest
}

/**
 * Calculates break-even APY for lenders
 */
export function calculateBreakEvenAPY(principal, fees, timeElapsed) {
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
  const BASIS_POINTS = 10000
  
  if (principal === 0 || timeElapsed === 0) return 0
  
  const rate = (fees * SECONDS_PER_YEAR) / (principal * timeElapsed)
  return Math.floor(rate * BASIS_POINTS)
}

/**
 * Calculates optimal APY based on market conditions
 */
export function calculateOptimalAPY(pythAPY, volatility, liquidityRatio, demandRatio) {
  const baseAPY = Number(pythAPY)
  
  // Adjust for volatility (higher volatility = higher APY)
  const volatilityAdjustment = volatility * 50 // 50 basis points per volatility unit
  
  // Adjust for liquidity (lower liquidity = higher APY)
  const liquidityAdjustment = (1 - liquidityRatio) * 100 // Up to 100 basis points
  
  // Adjust for demand (higher demand = higher APY)
  const demandAdjustment = demandRatio * 50 // Up to 50 basis points
  
  const optimalAPY = baseAPY + volatilityAdjustment + liquidityAdjustment + demandAdjustment
  
  // Ensure APY is within reasonable bounds
  return Math.max(100, Math.min(5000, Math.floor(optimalAPY)))
}

/**
 * Calculates APY range for lenders based on Pyth reference
 */
export function calculateAPYRange(pythAPY, range = 20) {
  const baseAPY = Number(pythAPY)
  
  return {
    min: Math.max(100, baseAPY - range), // Minimum 1%
    max: Math.min(5000, baseAPY + range), // Maximum 50%
    optimal: baseAPY,
    range
  }
}

/**
 * Calculates risk-adjusted APY
 */
export function calculateRiskAdjustedAPY(baseAPY, riskScore) {
  // Risk score from 0 (low risk) to 1 (high risk)
  const riskAdjustment = riskScore * 200 // Up to 200 basis points for high risk
  
  return Math.floor(baseAPY + riskAdjustment)
}

/**
 * Calculates APY for different borrower types
 */
export function calculateBorrowerAPY(baseAPY, borrowerType, amount) {
  const WHALE_THRESHOLD = 1000 * 10**6 // 1000 USDC
  
  if (borrowerType === 'whale' || amount >= WHALE_THRESHOLD) {
    // Whale borrowers pay premium
    return Math.floor(baseAPY * 1.1) // 10% premium
  } else {
    // Small borrowers get discount
    return Math.floor(baseAPY * 0.95) // 5% discount
  }
}

/**
 * Formats APY for display
 */
export function formatAPY(apy, decimals = 2) {
  return `${(Number(apy) / 100).toFixed(decimals)}%`
}

/**
 * Parses APY from string input
 */
export function parseAPY(apyString) {
  const apy = parseFloat(apyString)
  if (isNaN(apy)) return 0
  return Math.floor(apy * 100) // Convert to basis points
}

/**
 * Validates APY value
 */
export function validateAPY(apy) {
  const minAPY = 1 // 0.01%
  const maxAPY = 5000 // 50%
  
  return apy >= minAPY && apy <= maxAPY
}

/**
 * Calculates APY impact on pool
 */
export function calculateAPYImpact(newAPY, currentAverageAPY, newAmount, totalLiquidity) {
  const weight = newAmount / (totalLiquidity + newAmount)
  const impact = (newAPY - currentAverageAPY) * weight
  
  return {
    impact,
    newAverageAPY: currentAverageAPY + impact,
    weight
  }
}

/**
 * Utility constants
 */
export const APY_CONSTANTS = {
  BASIS_POINTS: 10000,
  SECONDS_PER_YEAR: 365 * 24 * 60 * 60,
  MIN_APY: 1, // 0.01%
  MAX_APY: 5000, // 50%
  DEFAULT_COMPOUNDING_FREQUENCY: 365
}
