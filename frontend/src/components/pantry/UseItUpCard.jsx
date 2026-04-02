import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight } from 'lucide-react';
import { createPageUrl } from '../../utils';

export default function UseItUpCard({ itemCount }) {
  const navigate = useNavigate();

  if (itemCount === 0) return null;

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-slate-900">Use It Up Mode</h3>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Generate a meal plan using ONLY your {itemCount} pantry items. Perfect for fridge cleanouts!
            </p>
            <Button
              onClick={() => navigate(createPageUrl('HealthDietHub'), { state: { useItUpMode: true } })}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Start Use It Up Mode
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="text-3xl font-bold text-amber-600">{itemCount}</div>
        </div>
      </CardContent>
    </Card>
  );
}