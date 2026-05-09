// Utility functions for the app

/**
 * Safely handle back navigation - only goes back if there's a screen to go back to
 * @param router - Expo router instance
 */
export const safeGoBack = (router: any): void => {
  try {
    router.back();
  } catch {
    // If can't go back, do nothing (silently fail)
  }
};

/**
 * Generate a unique ID for transactions and records
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Generate a receipt number for transactions
 * Format: SK-YYYYMMDD-XXX
 */
export const generateReceiptNumber = (): string => {
  const prefix = 'SK';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${date}-${random}`;
};

/**
 * Calculate total weight from array of weights
 */
export const calculateTotalWeight = (weights: number[]): number => {
  return weights.reduce((sum, w) => sum + w, 0);
};

// Alias for backwards compatibility
export const calculateTotalKilos = calculateTotalWeight;

/**
 * Calculate total amount based on weight and price per kilo
 */
export const calculateTotalAmount = (weight: number, pricePerKilo: number): number => {
  return weight * pricePerKilo;
};

/**
 * Format currency in Philippine Peso
 */
export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Calculate debt deduction and final amount
 * Returns the amount to deduct (capped at totalAmount)
 */
export const calculateDebtDeduction = (
  totalAmount: number,
  farmerDebt: number
): { debtDeducted: number; finalAmount: number } => {
  // Can only deduct up to the total amount
  const debtDeducted = Math.min(farmerDebt, totalAmount);
  const finalAmount = totalAmount - debtDeducted;
  return { debtDeducted, finalAmount };
};

/**
 * Calculate new farmer debt after transaction
 * Debt decreases by amount paid, but cannot go below 0
 */
export const calculateNewDebt = (currentDebt: number, amountPaid: number): number => {
  return Math.max(0, currentDebt - amountPaid);
};
