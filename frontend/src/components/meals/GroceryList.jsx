import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, ChevronDown, Copy, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function GroceryList({ mealPlan }) {
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set(['proteins', 'vegetables', 'grains']));

  const groceryItems = useMemo(() => {
    if (!mealPlan?.days) return {};

    const items = {
      proteins: new Set(),
      vegetables: new Set(),
      grains: new Set(),
      dairy: new Set(),
      fruits: new Set(),
      other: new Set()
    };

    const proteinKeywords = ['chicken', 'beef', 'salmon', 'fish', 'liver', 'turkey', 'pork', 'lamb', 'egg', 'tofu', 'tempeh', 'cod', 'trout', 'mackerel', 'tuna'];
    const vegetableKeywords = ['spinach', 'broccoli', 'carrot', 'asparagus', 'onion', 'garlic', 'pepper', 'tomato', 'lettuce', 'kale', 'cabbage', 'zucchini', 'mushroom', 'artichoke', 'brussels'];
    const grainKeywords = ['rice', 'quinoa', 'oat', 'bread', 'pasta', 'tortilla', 'barley'];
    const dairyKeywords = ['yogurt', 'cheese', 'milk', 'cream', 'butter'];
    const fruitKeywords = ['berry', 'berries', 'apple', 'banana', 'orange', 'lemon', 'avocado'];

    const categorizeWord = (word) => {
      const lowerWord = word.toLowerCase();
      if (proteinKeywords.some(k => lowerWord.includes(k))) return 'proteins';
      if (vegetableKeywords.some(k => lowerWord.includes(k))) return 'vegetables';
      if (grainKeywords.some(k => lowerWord.includes(k))) return 'grains';
      if (dairyKeywords.some(k => lowerWord.includes(k))) return 'dairy';
      if (fruitKeywords.some(k => lowerWord.includes(k))) return 'fruits';
      return null;
    };

    mealPlan.days.forEach(day => {
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        const meal = day[mealType];
        if (meal?.name) {
          const words = meal.name.split(/[\s,]+/);
          words.forEach(word => {
            const category = categorizeWord(word);
            if (category) {
              items[category].add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
            }
          });
        }
      });
    });

    // Convert Sets to Arrays
    return Object.fromEntries(
      Object.entries(items).map(([key, value]) => [key, Array.from(value).sort()])
    );
  }, [mealPlan]);

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleItem = (item) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
  };

  const copyToClipboard = () => {
    const allItems = Object.entries(groceryItems)
      .map(([category, items]) => 
        items.length > 0 
          ? `${category.charAt(0).toUpperCase() + category.slice(1)}:\n${items.map(i => `  - ${i}`).join('\n')}`
          : ''
      )
      .filter(Boolean)
      .join('\n\n');
    
    navigator.clipboard.writeText(allItems);
  };

  const categoryColors = {
    proteins: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    vegetables: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    grains: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    dairy: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    fruits: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    other: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
  };

  const totalItems = Object.values(groceryItems).flat().length;
  const checkedCount = checkedItems.size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Grocery List</h3>
            <p className="text-sm text-slate-500">{checkedCount}/{totalItems} items checked</p>
          </div>
        </div>
        
        <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
          <Copy className="w-4 h-4" />
          Copy
        </Button>
      </div>

      <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
        {Object.entries(groceryItems).map(([category, items]) => {
          if (items.length === 0) return null;
          const colors = categoryColors[category];
          const isExpanded = expandedCategories.has(category);
          
          return (
            <div key={category} className={`rounded-xl border ${colors.border} overflow-hidden`}>
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full px-4 py-3 flex items-center justify-between ${colors.bg}`}
              >
                <span className={`font-medium ${colors.text} capitalize`}>
                  {category} ({items.length})
                </span>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                  <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white"
                  >
                    <div className="p-3 space-y-1">
                      {items.map((item) => (
                        <div
                          key={item}
                          onClick={() => toggleItem(item)}
                          className={`
                            flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
                            ${checkedItems.has(item) ? 'bg-slate-50' : 'hover:bg-slate-50'}
                          `}
                        >
                          <Checkbox checked={checkedItems.has(item)} />
                          <span className={`text-sm ${checkedItems.has(item) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}