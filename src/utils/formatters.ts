
/**
 * Format a number to Indian currency format (lakhs, crores)
 * @param value - The number to format
 * @returns Formatted string with appropriate suffix (L, Cr, K)
 */
export const formatIndianCurrency = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '₹0';
  }
  
  // For values in crores (10M+)
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  // For values in lakhs (100K+)
  else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  // For values in thousands
  else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  // For smaller values
  else {
    return `₹${value.toFixed(0)}`;
  }
};

/**
 * Format attendance percentage
 * @param value - The attendance value (0-100)
 * @returns Formatted string with percentage
 */
export const formatAttendance = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(1)}%`;
};
