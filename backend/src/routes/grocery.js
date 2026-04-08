import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── Price database (USDA averages) ──────────────────────────────────────────
const PRICE_DB = {
  // Proteins
  'chicken breast': 8.99, 'chicken thigh': 5.99, 'ground beef': 7.99, 'ground turkey': 6.99,
  'salmon': 12.99, 'tuna': 1.99, 'tilapia': 6.99, 'shrimp': 11.99, 'sardines': 2.49,
  'eggs': 3.99, 'tofu': 4.99, 'tempeh': 5.99, 'edamame': 3.99,
  'greek yogurt': 5.99, 'cottage cheese': 4.99, 'milk': 3.49, 'cheese': 5.99,
  'turkey breast': 8.99, 'pork tenderloin': 7.99, 'lamb': 12.99,
  // Vegetables
  'broccoli': 2.49, 'spinach': 3.99, 'kale': 3.49, 'arugula': 3.99,
  'carrots': 1.99, 'sweet potato': 2.99, 'potato': 2.49, 'yam': 2.99,
  'bell pepper': 3.49, 'tomato': 2.99, 'cherry tomatoes': 3.99,
  'onion': 0.99, 'garlic': 1.49, 'shallot': 2.49, 'leek': 2.99,
  'zucchini': 1.99, 'cucumber': 1.49, 'celery': 2.49, 'cauliflower': 3.49,
  'mushroom': 3.99, 'asparagus': 4.99, 'green beans': 2.99, 'peas': 2.49,
  'avocado': 1.49, 'lettuce': 2.49, 'cabbage': 1.99, 'brussel sprouts': 3.49,
  // Fruits
  'blueberries': 4.99, 'strawberries': 3.99, 'raspberries': 4.49, 'blackberries': 4.99,
  'banana': 0.29, 'apple': 0.99, 'orange': 0.99, 'lemon': 0.79, 'lime': 0.49,
  'mango': 1.49, 'pineapple': 3.99, 'grapes': 3.99, 'peach': 1.49,
  // Grains & Legumes
  'quinoa': 5.99, 'brown rice': 2.99, 'oats': 3.99, 'whole wheat bread': 3.49,
  'lentils': 2.49, 'black beans': 1.49, 'chickpeas': 1.49, 'kidney beans': 1.49,
  'pasta': 1.99, 'whole wheat pasta': 2.99, 'barley': 2.99,
  // Pantry
  'olive oil': 7.99, 'coconut oil': 5.99, 'butter': 4.99, 'ghee': 8.99,
  'almond butter': 7.99, 'peanut butter': 4.99, 'tahini': 6.99,
  'almonds': 9.99, 'walnuts': 8.99, 'cashews': 9.99, 'chia seeds': 7.99,
  'flax seeds': 4.99, 'hemp seeds': 8.99, 'sunflower seeds': 4.99,
  'turmeric': 4.99, 'ginger': 2.99, 'cinnamon': 3.49, 'cumin': 2.99,
  'soy sauce': 3.49, 'apple cider vinegar': 4.99, 'honey': 6.99, 'maple syrup': 8.99,
  'vegetable broth': 2.99, 'chicken broth': 2.99, 'coconut milk': 2.49,
  'nutritional yeast': 8.99, 'protein powder': 29.99,
};

function estimateItemPrice(itemName) {
  const lower = itemName.toLowerCase();
  for (const [key, price] of Object.entries(PRICE_DB)) {
    if (lower.includes(key)) return price;
  }
  return 3.99; // default estimate
}

// Build Instacart "shop all" URL from item list
function buildInstacartUrl(items) {
  // Instacart doesn't have a multi-item URL, so we build a search for the biggest items
  const topItems = items.slice(0, 5).map(i => encodeURIComponent(i)).join('+');
  return `https://www.instacart.com/store/s?k=${topItems}&utm_source=vitaplate`;
}

function buildWalmartUrl(items) {
  const topItem = encodeURIComponent(items[0] || 'grocery');
  return `https://www.walmart.com/search?q=${topItem}&utm_source=vitaplate`;
}

function buildAmazonFreshUrl(items) {
  const topItem = encodeURIComponent(items[0] || 'grocery');
  return `https://www.amazon.com/s?k=${topItem}&i=amazonfresh&tag=vitaplate-20`;
}

// GET /api/grocery-lists — list user's grocery lists
router.get('/', requireAuth, async (req, res) => {
  try {
    const lists = await prisma.groceryList.findMany({
      where:   { userId: req.userId },
      orderBy: { createdDate: 'desc' },
    });
    res.json(lists);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/grocery-lists/:id — get single list with price estimates
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const list = await prisma.groceryList.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!list) return res.status(404).json({ error: 'Not found' });

    // Add price estimates to each item
    const items = list.items || {};
    let totalEstimate = 0;
    const enriched = {};

    for (const [category, categoryItems] of Object.entries(items)) {
      enriched[category] = (Array.isArray(categoryItems) ? categoryItems : []).map(item => {
        const itemName = typeof item === 'string' ? item : item.name || item;
        const price    = estimateItemPrice(itemName);
        totalEstimate += price;
        return typeof item === 'string'
          ? { name: item, estimatedPrice: price, checked: false }
          : { ...item, estimatedPrice: item.estimatedPrice || price };
      });
    }

    // Build all flat item names for retailer links
    const allItemNames = Object.values(enriched).flat().map(i => i.name || i);

    res.json({
      ...list,
      items:          enriched,
      totalEstimate:  parseFloat(totalEstimate.toFixed(2)),
      itemCount:      allItemNames.length,
      retailerLinks: {
        instacart:   buildInstacartUrl(allItemNames),
        walmart:     buildWalmartUrl(allItemNames),
        amazonFresh: buildAmazonFreshUrl(allItemNames),
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/grocery-lists — create a grocery list
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, mealPlanId, items, totalCost } = req.body;
    const list = await prisma.groceryList.create({
      data: { userId: req.userId, name: name || 'My Grocery List', mealPlanId, items: items || {}, totalCost },
    });
    res.status(201).json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/grocery-lists/:id — update list (check off items, update prices)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const list = await prisma.groceryList.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!list) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.groceryList.update({ where: { id: list.id }, data: req.body });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/grocery-lists/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const list = await prisma.groceryList.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!list) return res.status(404).json({ error: 'Not found' });
    await prisma.groceryList.delete({ where: { id: list.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/grocery-lists/:id/check — toggle item checked state
router.post('/:id/check', requireAuth, async (req, res) => {
  try {
    const { category, itemIndex, checked } = req.body;
    const list = await prisma.groceryList.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!list) return res.status(404).json({ error: 'Not found' });

    const items = list.items || {};
    if (items[category]?.[itemIndex] !== undefined) {
      if (typeof items[category][itemIndex] === 'string') {
        items[category][itemIndex] = { name: items[category][itemIndex], checked, estimatedPrice: 0 };
      } else {
        items[category][itemIndex].checked = checked;
      }
    }

    const updated = await prisma.groceryList.update({ where: { id: list.id }, data: { items } });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/grocery-lists/price-estimate — estimate price for a single item name
router.get('/price-estimate/:itemName', requireAuth, (req, res) => {
  const price = estimateItemPrice(decodeURIComponent(req.params.itemName));
  res.json({ item: req.params.itemName, estimatedPrice: price });
});

export default router;
