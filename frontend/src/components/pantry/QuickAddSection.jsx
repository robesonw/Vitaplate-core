import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Barcode, X } from 'lucide-react';
import { toast } from 'sonner';

const COMMON_INGREDIENTS = [
  'Chicken breast', 'Ground beef', 'Salmon', 'Eggs', 'Milk', 'Yogurt', 'Cheese',
  'Broccoli', 'Spinach', 'Carrots', 'Tomatoes', 'Onions', 'Garlic', 'Bell peppers',
  'Rice', 'Pasta', 'Oats', 'Bread', 'Olive oil', 'Butter', 'Salt', 'Black pepper',
  'Honey', 'Peanut butter', 'Almonds', 'Blueberries', 'Apples', 'Bananas'
];

export default function QuickAddSection({ onAdd, onBarcodeClick }) {
  const [input, setInput] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = input.trim()
    ? COMMON_INGREDIENTS.filter(ing => ing.toLowerCase().includes(input.toLowerCase()))
    : [];

  const handleQuickAdd = (name = input) => {
    if (!name.trim()) {
      toast.error('Please enter an ingredient name');
      return;
    }

    onAdd({
      name: name.trim(),
      quantity: quantity || 'standard amount',
      expiry_date: expiryDate,
      category: 'Other',
    });

    setInput('');
    setQuantity('');
    setExpiryDate('');
    setShowSuggestions(false);
  };

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
      <CardContent className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">What's in My Fridge?</h3>
        
        <div className="space-y-3">
          {/* Ingredient input with autocomplete */}
          <div className="relative">
            <Label className="text-sm">Ingredient Name</Label>
            <div className="relative">
              <Input
                placeholder="Type ingredient name..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd();
                }}
                className="mt-1"
              />
              {input && (
                <button
                  onClick={() => {
                    setInput('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                {filteredSuggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleQuickAdd(suggestion)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 border-b border-slate-100 last:border-b-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity and expiry in one row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Quantity (optional)</Label>
              <Input
                placeholder="e.g., 2 lbs"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Expiry Date (optional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => handleQuickAdd()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
            <Button
              onClick={onBarcodeClick}
              variant="outline"
              className="px-3"
              title="Scan barcode"
            >
              <Barcode className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}