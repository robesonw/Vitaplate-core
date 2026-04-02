// Estimated average grocery prices (in USD) - can be updated periodically
// Based on USDA average prices and typical grocery store pricing

export const groceryPriceEstimates = {
  // Proteins
  'chicken breast': 8.99,
  'ground beef': 7.99,
  'salmon': 12.99,
  'eggs': 3.99,
  'turkey': 6.99,
  'tofu': 4.99,
  'greek yogurt': 5.99,
  'milk': 3.49,
  'cheese': 5.99,
  'tuna': 1.99,

  // Vegetables
  'broccoli': 2.49,
  'spinach': 3.99,
  'carrots': 1.99,
  'bell peppers': 3.49,
  'tomatoes': 2.99,
  'onions': 0.99,
  'garlic': 1.49,
  'lettuce': 2.49,
  'cucumber': 1.49,
  'zucchini': 1.99,
  'asparagus': 4.99,
  'broccoli': 2.49,
  'cauliflower': 3.49,
  'kale': 3.99,
  'sweet potato': 0.79,
  'potato': 0.69,

  // Fruits
  'banana': 0.59,
  'apple': 1.49,
  'orange': 1.29,
  'berries': 4.99,
  'blueberry': 5.99,
  'strawberry': 4.49,
  'avocado': 1.99,
  'lemon': 0.79,
  'lime': 0.69,
  'grape': 2.99,

  // Grains
  'rice': 2.99,
  'oats': 3.99,
  'pasta': 1.99,
  'bread': 3.49,
  'quinoa': 5.99,
  'brown rice': 3.49,

  // Pantry
  'olive oil': 8.99,
  'salt': 2.99,
  'pepper': 3.99,
  'honey': 5.99,
  'peanut butter': 4.49,
  'almonds': 8.99,
  'nuts': 7.99,
  'seeds': 4.99,

  // Spices & Herbs (small amounts)
  'turmeric': 4.99,
  'ginger': 1.99,
  'cumin': 3.99,
  'paprika': 3.49,
  'cinnamon': 4.99
};

/**
 * Estimate price for a grocery item by name
 */
export function estimateItemPrice(itemName) {
  if (!itemName) return 3.99; // Default estimate

  const lowerName = itemName.toLowerCase();
  
  // Try exact match first
  if (groceryPriceEstimates[lowerName]) {
    return groceryPriceEstimates[lowerName];
  }

  // Try partial match
  for (const [key, price] of Object.entries(groceryPriceEstimates)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return price;
    }
  }

  // Default estimate
  return 3.99;
}

/**
 * Calculate total estimated price for a list of items
 */
export function calculateListTotal(items, quantities = {}) {
  return items.reduce((total, item) => {
    const price = estimateItemPrice(item.name || item);
    const qty = quantities[item.id || item] || 1;
    return total + (price * qty);
  }, 0);
}