import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const thyroidConditions = [
  { value: 'none', label: 'None' },
  { value: 'hypothyroidism', label: 'Hypothyroidism' },
  { value: 'hyperthyroidism', label: 'Hyperthyroidism' },
  { value: 'hashimotos', label: 'Hashimoto\'s Thyroiditis' },
  { value: 'pcos', label: 'PCOS (Polycystic Ovary Syndrome)' },
  { value: 'hormone_imbalance', label: 'Hormone Imbalance' },
];

export default function ThyroidHealthForm({ thyroidCondition, setThyroidCondition }) {
  return (
    <>
      <div>
        <Label className="mb-2 block">Thyroid & Hormone Health</Label>
        <Select value={thyroidCondition} onValueChange={setThyroidCondition}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {thyroidConditions.map(tc => (
              <SelectItem key={tc.value} value={tc.value}>{tc.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {thyroidCondition !== 'none' && (
          <p className="text-xs text-purple-600 mt-2">
            ✓ Thyroid mode enabled: Your meals will prioritize iodine, selenium, zinc, and anti-inflammatory foods.
          </p>
        )}
      </div>

      <Separator />
    </>
  );
}