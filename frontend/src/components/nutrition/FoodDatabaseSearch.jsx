import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function FoodDatabaseSearch({ onSelectFood }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a food name to search');
      return;
    }

    setIsSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the USDA FoodData Central database for: "${searchQuery}". Return up to 8 results with detailed nutritional information including macros and key micronutrients.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            foods: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  food_id: { type: "string" },
                  source: { type: "string", enum: ["usda", "open_food_facts"] },
                  serving_size: { type: "string" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  micronutrients: {
                    type: "object",
                    additionalProperties: {
                      type: "object",
                      properties: {
                        value: { type: "number" },
                        unit: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (result?.foods && result.foods.length > 0) {
        setSearchResults(result.foods);
      } else {
        toast.info('No foods found. Try a different search term.');
        setSearchResults([]);
      }
    } catch (error) {
      toast.error('Failed to search food database');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for foods (e.g., apple, chicken breast, milk)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {searchResults.map((food, idx) => (
            <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelectFood(food)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{food.name}</p>
                      <Badge variant="outline" className="text-xs">
                        <Database className="w-3 h-3 mr-1" />
                        {food.source === 'usda' ? 'USDA' : 'Open Food Facts'}
                      </Badge>
                    </div>
                    {food.description && (
                      <p className="text-xs text-slate-500 mb-2">{food.description}</p>
                    )}
                    <div className="flex gap-3 text-xs">
                      <span className="text-slate-600">
                        <span className="font-medium">{food.calories}</span> kcal
                      </span>
                      <span className="text-blue-600">
                        <span className="font-medium">{food.protein}g</span> protein
                      </span>
                      <span className="text-amber-600">
                        <span className="font-medium">{food.carbs}g</span> carbs
                      </span>
                      <span className="text-rose-600">
                        <span className="font-medium">{food.fat}g</span> fat
                      </span>
                    </div>
                    {food.serving_size && (
                      <p className="text-xs text-slate-500 mt-1">Per {food.serving_size}</p>
                    )}
                    {food.micronutrients && Object.keys(food.micronutrients).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(food.micronutrients).slice(0, 5).map(([nutrient, data]) => (
                          <Badge key={nutrient} variant="secondary" className="text-xs">
                            {nutrient}: {data.value}{data.unit}
                          </Badge>
                        ))}
                        {Object.keys(food.micronutrients).length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{Object.keys(food.micronutrients).length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}