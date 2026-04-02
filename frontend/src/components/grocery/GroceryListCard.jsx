import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function GroceryListCard({ 
  item, 
  onCheck, 
  onDelete, 
  onUpdate,
  pricePerUnit = null 
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleCheck = async () => {
    setIsUpdating(true);
    try {
      await onCheck(item.id, !item.checked);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      await onDelete(item.id);
      toast.success('Item removed');
    } finally {
      setIsUpdating(false);
    }
  };

  const estimatedPrice = pricePerUnit ? (pricePerUnit * (item.quantity || 1)) : null;

  return (
    <Card className={`border-slate-200 ${item.checked ? 'opacity-50 bg-slate-50' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={item.checked || false}
            onCheckedChange={handleToggleCheck}
            disabled={isUpdating}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-slate-900 ${item.checked ? 'line-through text-slate-500' : ''}`}>
              {item.name}
            </p>
            {item.category && (
              <p className="text-xs text-slate-600">{item.category}</p>
            )}
            {item.quantity && (
              <p className="text-xs text-slate-600 mt-1">
                Qty: {item.quantity}
                {estimatedPrice && ` • Est: $${estimatedPrice.toFixed(2)}`}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isUpdating}
            className="text-slate-400 hover:text-red-600 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}