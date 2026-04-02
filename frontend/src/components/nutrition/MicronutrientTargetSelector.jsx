import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

const COMMON_MICRONUTRIENTS = [
  { name: 'Vitamin A', unit: 'mcg', dailyValue: 900 },
  { name: 'Vitamin C', unit: 'mg', dailyValue: 90 },
  { name: 'Vitamin D', unit: 'mcg', dailyValue: 20 },
  { name: 'Vitamin E', unit: 'mg', dailyValue: 15 },
  { name: 'Vitamin K', unit: 'mcg', dailyValue: 120 },
  { name: 'Vitamin B6', unit: 'mg', dailyValue: 1.7 },
  { name: 'Vitamin B12', unit: 'mcg', dailyValue: 2.4 },
  { name: 'Folate', unit: 'mcg', dailyValue: 400 },
  { name: 'Calcium', unit: 'mg', dailyValue: 1000 },
  { name: 'Iron', unit: 'mg', dailyValue: 18 },
  { name: 'Magnesium', unit: 'mg', dailyValue: 400 },
  { name: 'Potassium', unit: 'mg', dailyValue: 3400 },
  { name: 'Sodium', unit: 'mg', dailyValue: 2300 },
  { name: 'Zinc', unit: 'mg', dailyValue: 11 },
  { name: 'Selenium', unit: 'mcg', dailyValue: 55 },
  { name: 'Omega-3', unit: 'g', dailyValue: 1.6 }
];

export default function MicronutrientTargetSelector({ targets = {}, onChange }) {
  const [selectedNutrient, setSelectedNutrient] = useState('');
  const [customValue, setCustomValue] = useState('');

  const handleAdd = () => {
    if (!selectedNutrient || !customValue) return;

    const nutrientInfo = COMMON_MICRONUTRIENTS.find(n => n.name === selectedNutrient);
    const newTargets = {
      ...targets,
      [selectedNutrient]: {
        value: parseFloat(customValue),
        unit: nutrientInfo?.unit || 'mg'
      }
    };
    onChange(newTargets);
    setSelectedNutrient('');
    setCustomValue('');
  };

  const handleRemove = (nutrient) => {
    const newTargets = { ...targets };
    delete newTargets[nutrient];
    onChange(newTargets);
  };

  const handleUseDailyValue = () => {
    if (!selectedNutrient) return;

    const nutrientInfo = COMMON_MICRONUTRIENTS.find(n => n.name === selectedNutrient);
    if (!nutrientInfo) return;

    const newTargets = {
      ...targets,
      [selectedNutrient]: {
        value: nutrientInfo.dailyValue,
        unit: nutrientInfo.unit
      }
    };
    onChange(newTargets);
    setSelectedNutrient('');
  };

  const availableNutrients = COMMON_MICRONUTRIENTS.filter(n => !targets[n.name]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Micronutrient Targets</Label>
        
        {Object.keys(targets).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(targets).map(([nutrient, data]) => (
              <Badge key={nutrient} variant="secondary" className="px-3 py-1">
                {nutrient}: {data.value}{data.unit}
                <button
                  onClick={() => handleRemove(nutrient)}
                  className="ml-2 hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select value={selectedNutrient} onValueChange={setSelectedNutrient}>
            <SelectTrigger>
              <SelectValue placeholder="Select micronutrient" />
            </SelectTrigger>
            <SelectContent>
              {availableNutrients.map(nutrient => (
                <SelectItem key={nutrient.name} value={nutrient.name}>
                  {nutrient.name} ({nutrient.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Target value"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            disabled={!selectedNutrient}
          />

          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              onClick={handleUseDailyValue}
              disabled={!selectedNutrient}
              variant="outline"
              className="flex-1"
            >
              Use RDA
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={!selectedNutrient || !customValue}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mt-2">
          RDA = Recommended Daily Allowance. Adjust based on your doctor's recommendations.
        </p>
      </div>
    </div>
  );
}