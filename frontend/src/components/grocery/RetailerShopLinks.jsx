import React from 'react';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const RETAILERS = [
  {
    id: 'instacart',
    name: 'Instacart',
    logo: '🛒',
    color: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-800',
    buildUrl: (itemName, affiliateId) => {
      const query = encodeURIComponent(itemName);
      const base = `https://www.instacart.com/store/s?k=${query}`;
      return affiliateId ? `${base}&utm_source=${affiliateId}` : base;
    }
  },
  {
    id: 'walmart',
    name: 'Walmart',
    logo: '🔵',
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800',
    buildUrl: (itemName, affiliateId) => {
      const query = encodeURIComponent(itemName);
      const base = `https://www.walmart.com/search?q=${query}`;
      return affiliateId ? `${base}&affiliateId=${affiliateId}` : base;
    }
  },
  {
    id: 'amazon',
    name: 'Amazon Fresh',
    logo: '📦',
    color: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-800',
    buildUrl: (itemName, affiliateId) => {
      const query = encodeURIComponent(itemName);
      const tag = affiliateId ? `&tag=${affiliateId}` : '';
      return `https://www.amazon.com/s?k=${query}&i=amazonfresh${tag}`;
    }
  }
];

export default function RetailerShopLinks({ itemName, compact = false }) {
  const affiliateIds = (() => {
    try {
      return JSON.parse(localStorage.getItem('vitaplate_affiliate_ids') || '{}');
    } catch {
      return {};
    }
  })();

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex gap-1">
          {RETAILERS.map(retailer => (
            <Tooltip key={retailer.id}>
              <TooltipTrigger asChild>
                <a
                  href={retailer.buildUrl(itemName, affiliateIds[retailer.id])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs px-1.5 py-0.5 rounded border ${retailer.color} transition-colors`}
                  onClick={e => e.stopPropagation()}
                >
                  {retailer.logo}
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Shop on {retailer.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {RETAILERS.map(retailer => (
        <a
          key={retailer.id}
          href={retailer.buildUrl(itemName, affiliateIds[retailer.id])}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${retailer.color} transition-colors font-medium`}
          onClick={e => e.stopPropagation()}
        >
          <span>{retailer.logo}</span>
          <span>{retailer.name}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
        </a>
      ))}
    </div>
  );
}

export function ShopAllRetailersButton({ items }) {
  const affiliateIds = (() => {
    try {
      return JSON.parse(localStorage.getItem('vitaplate_affiliate_ids') || '{}');
    } catch {
      return {};
    }
  })();

  const allItemNames = items.map(i => i.name).join(', ');

  const openAll = (retailer) => {
    // Open each item in a new tab for the selected retailer
    items.slice(0, 10).forEach((item, idx) => {
      setTimeout(() => {
        window.open(retailer.buildUrl(item.name, affiliateIds[retailer.id]), '_blank');
      }, idx * 300);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {RETAILERS.map(retailer => (
        <Button
          key={retailer.id}
          variant="outline"
          size="sm"
          onClick={() => openAll(retailer)}
          className={`text-xs ${retailer.color} border`}
        >
          <ShoppingCart className="w-3 h-3 mr-1" />
          Shop all on {retailer.name}
        </Button>
      ))}
    </div>
  );
}