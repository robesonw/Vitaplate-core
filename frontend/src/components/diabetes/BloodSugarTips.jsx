import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const BLOOD_SUGAR_TIPS = [
  {
    title: 'Pair carbs with protein',
    description: 'Eating protein with carbs slows digestion and reduces blood sugar spikes. Example: apple with almond butter.'
  },
  {
    title: 'Add vinegar before meals',
    description: 'Apple cider vinegar or lemon juice can reduce blood sugar response by up to 30%. Add to salad dressings or sip before eating.'
  },
  {
    title: 'Eat vegetables first',
    description: 'Start your meal with non-starchy vegetables (leafy greens, broccoli, cauliflower) to improve glucose response.'
  },
  {
    title: 'Move after meals',
    description: 'A 2-3 minute walk after eating (especially after carbs) can reduce blood sugar spikes by 20-30%.'
  },
  {
    title: 'Choose resistant starch',
    description: 'Cooked and cooled potatoes, pasta, or rice have lower glycemic impact. Avoid serving hot starchy foods alone.'
  },
  {
    title: 'Include cinnamon daily',
    description: 'Cinnamon may improve insulin sensitivity. Add to oatmeal, yogurt, or beverages for 1-3g daily.'
  },
];

export default function BloodSugarTips() {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % BLOOD_SUGAR_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const tip = BLOOD_SUGAR_TIPS[currentTip];

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-900">
          <Lightbulb className="w-5 h-5" />
          Managing Blood Sugar with Food
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[120px] flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-emerald-900 mb-2">{tip.title}</h3>
            <p className="text-sm text-emerald-700 leading-relaxed">{tip.description}</p>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-1">
              {BLOOD_SUGAR_TIPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentTip ? 'bg-emerald-600 w-6' : 'bg-emerald-300 w-1.5'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-emerald-600 font-medium">
              {currentTip + 1} of {BLOOD_SUGAR_TIPS.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}