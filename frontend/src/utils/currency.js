// Currency utility for Indian Rupees
export const CURRENCY_SYMBOL = '₹';

// Format price to Indian Rupees with proper formatting
export const formatPrice = (price) => {
  if (price === undefined || price === null) return `${CURRENCY_SYMBOL}0`;
  
  // Convert to number if it's a string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Format with Indian numbering system (lakhs, crores)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(numPrice);
};

// Format price without currency symbol (for calculations)
export const formatPriceNumber = (price) => {
  if (price === undefined || price === null) return 0;
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return numPrice;
};

// Convert USD to INR (approximate rate - you can update this)
export const convertToINR = (usdPrice) => {
  const rate = 83; // 1 USD = 83 INR (approximate)
  return usdPrice * rate;
};

// Display price (if your backend stores in USD)
export const displayPrice = (priceInUSD) => {
  const inrPrice = convertToINR(priceInUSD);
  return formatPrice(inrPrice);
};