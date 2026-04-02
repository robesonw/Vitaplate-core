import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

const RETAILERS = [
  {
    id: 'instacart',
    name: 'Instacart',
    logo: '🛒',
    placeholder: 'Your Instacart affiliate/partner ID',
    helpUrl: 'https://www.instacart.com/advertise',
    helpText: 'Sign up at Instacart Advertising'
  },
  {
    id: 'walmart',
    name: 'Walmart Grocery',
    logo: '🔵',
    placeholder: 'Your Walmart affiliate ID (Impact Radius)',
    helpUrl: 'https://affiliates.walmart.com',
    helpText: 'Sign up at Walmart Affiliate Program'
  },
  {
    id: 'amazon',
    name: 'Amazon Fresh',
    logo: '📦',
    placeholder: 'Your Amazon Associates tag (e.g. mysite-20)',
    helpUrl: 'https://affiliate-program.amazon.com',
    helpText: 'Sign up at Amazon Associates'
  }
];

export default function AffiliateSettings() {
  const [ids, setIds] = useState({ instacart: '', walmart: '', amazon: '' });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('vitaplate_affiliate_ids') || '{}');
      setIds(prev => ({ ...prev, ...saved }));
    } catch {}
  }, []);

  const handleSave = () => {
    localStorage.setItem('vitaplate_affiliate_ids', JSON.stringify(ids));
    toast.success('Affiliate IDs saved!');
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-indigo-600" />
          <CardTitle>Grocery Retailer Affiliate IDs</CardTitle>
        </div>
        <CardDescription>
          Optionally add your affiliate IDs to earn commission when users shop via your grocery links. 
          Leave blank to use standard search links without affiliate tracking.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {RETAILERS.map(retailer => (
          <div key={retailer.id} className="space-y-2">
            <Label className="flex items-center gap-2">
              <span>{retailer.logo}</span>
              <span>{retailer.name}</span>
            </Label>
            <Input
              placeholder={retailer.placeholder}
              value={ids[retailer.id] || ''}
              onChange={e => setIds(prev => ({ ...prev, [retailer.id]: e.target.value }))}
            />
            <a
              href={retailer.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              {retailer.helpText}
            </a>
          </div>
        ))}
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
          Save Affiliate IDs
        </Button>
      </CardContent>
    </Card>
  );
}