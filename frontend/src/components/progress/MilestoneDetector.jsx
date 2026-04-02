import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

const MILESTONES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export default function MilestoneDetector({ entries = [] }) {
  const milestones = useMemo(() => {
    if (entries.length < 2) return [];

    const weights = entries
      .filter(e => e.weight)
      .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));

    if (weights.length < 2) return [];

    const startWeight = weights[0].weight;
    const currentWeight = weights[weights.length - 1].weight;
    const totalLoss = startWeight - currentWeight;

    if (totalLoss <= 0) return [];

    return MILESTONES.filter(m => totalLoss >= m).map(m => ({
      amount: m,
      achieved: true,
      date: weights[weights.length - 1].entry_date
    }));
  }, [entries]);

  if (milestones.length === 0) return null;

  return (
    <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-5 h-5 text-yellow-600" />
          <p className="font-semibold text-slate-900">Milestones Achieved!</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {milestones.map(m => (
            <Badge key={m.amount} className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
              🎉 {m.amount} lbs Lost
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}