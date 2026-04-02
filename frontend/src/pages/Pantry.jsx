import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Package, Plus, Trash2, ChefHat, AlertTriangle, Search, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import QuickAddSection from '../components/pantry/QuickAddSection';
import BarcodeScanner from '../components/pantry/BarcodeScanner';
import UseItUpCard from '../components/pantry/UseItUpCard';

const CATEGORIES = ['Proteins', 'Vegetables', 'Fruits', 'Grains', 'Dairy/Alternatives', 'Spices & Condiments', 'Other'];

const categoryIcons = {
  'Proteins': '🥩',
  'Vegetables': '🥦',
  'Fruits': '🍎',
  'Grains': '🌾',
  'Dairy/Alternatives': '🥛',
  'Spices & Condiments': '🫙',
  'Other': '📦',
};

const categoryColors = {
  'Proteins': 'bg-red-50 border-red-100',
  'Vegetables': 'bg-green-50 border-green-100',
  'Fruits': 'bg-orange-50 border-orange-100',
  'Grains': 'bg-amber-50 border-amber-100',
  'Dairy/Alternatives': 'bg-blue-50 border-blue-100',
  'Spices & Condiments': 'bg-purple-50 border-purple-100',
  'Other': 'bg-slate-50 border-slate-100',
};

export default function Pantry() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Other', quantity: '', expiry_date: '', notes: '' });

  const queryClient = useQueryClient();

  const { data: pantryItems = [], isLoading } = useQuery({
    queryKey: ['pantryItems'],
    queryFn: () => base44.entities.PantryItem.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PantryItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantryItems'] });
      setShowAddDialog(false);
      setNewItem({ name: '', category: 'Other', quantity: '', expiry_date: '', notes: '' });
      toast.success('Item added to pantry!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PantryItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pantryItems'] });
      toast.success('Item removed');
    },
  });

  const handleAdd = () => {
    if (!newItem.name.trim()) { toast.error('Please enter an item name'); return; }
    createMutation.mutate(newItem);
  };

  const handleQuickAdd = (itemData) => {
    createMutation.mutate({
      ...itemData,
      category: itemData.category || 'Other',
    });
  };

  const handleBarcodeScanned = (barcode) => {
    // In a real implementation, you'd send this to a barcode database API
    // For now, just show a prompt to manually select/confirm the item
    toast.info(`Barcode: ${barcode}\n\nPlease manually confirm or add the item.`);
    setShowAddDialog(true);
  };

  const filteredItems = pantryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemsByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filteredItems.filter(i => i.category === cat);
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];
  const expiringItems = pantryItems.filter(item => {
    if (!item.expiry_date) return false;
    const daysUntil = Math.round((new Date(item.expiry_date) - new Date(today)) / (1000 * 60 * 60 * 24));
    return daysUntil <= 3 && daysUntil >= 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-indigo-600" />
            My Pantry
          </h1>
          <p className="text-slate-600 mt-1">Track ingredients you have at home to reduce grocery costs</p>
        </div>
        <Button
          asChild
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <a href="#" onClick={(e) => { e.preventDefault(); setShowAddDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </a>
        </Button>
      </div>

      {/* Quick Add Section */}
      <QuickAddSection 
        onAdd={handleQuickAdd}
        onBarcodeClick={() => setScannerOpen(true)}
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onOpenChange={setScannerOpen}
        onBarcodeDetected={handleBarcodeScanned}
      />

      {/* Use It Up Card */}
      {pantryItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <UseItUpCard itemCount={pantryItems.length} />
        </motion.div>
      )}

      {/* Expiring soon banner */}
      {expiringItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Items expiring soon</p>
              <p className="text-sm text-amber-700 mt-1">
                {expiringItems.map(i => i.name).join(', ')} — use these first!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{pantryItems.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Items</p>
          </CardContent>
        </Card>
        {CATEGORIES.slice(0, 3).map(cat => (
          <Card key={cat} className="border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{pantryItems.filter(i => i.category === cat).length}</p>
              <p className="text-xs text-slate-500 mt-1">{categoryIcons[cat]} {cat.split('/')[0]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search pantry items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Items by Category */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading pantry...</div>
      ) : pantryItems.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-16 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Your pantry is empty</p>
            <p className="text-sm text-slate-400 mt-1">Add ingredients you have at home to get personalized meal plans</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {CATEGORIES.map(category => {
            const items = itemsByCategory[category];
            if (items.length === 0) return null;
            return (
              <Card key={category} className={`border ${categoryColors[category]}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">{categoryIcons[category]}</span>
                    {category}
                    <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map(item => {
                        const isExpiringSoon = item.expiry_date && 
                          Math.round((new Date(item.expiry_date) - new Date(today)) / (1000 * 60 * 60 * 24)) <= 3;
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-100"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-800 truncate">{item.name}</span>
                                {isExpiringSoon && (
                                  <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1 py-0">expiring</Badge>
                                )}
                              </div>
                              {item.quantity && (
                                <span className="text-xs text-slate-500">{item.quantity}</span>
                              )}
                              {item.expiry_date && (
                                <span className="text-xs text-slate-400 ml-2">exp: {item.expiry_date}</span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tip card */}
      {pantryItems.length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4 flex items-start gap-3">
            <ChefHat className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-indigo-900">
                You have {pantryItems.length} items in your pantry!
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                When generating a meal plan, enable "Use pantry items" to get recipes that use what you already have.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Pantry Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input
                placeholder="e.g., Chicken breast, Rice, Olive oil..."
                value={newItem.name}
                onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={newItem.category} onValueChange={v => setNewItem(p => ({ ...p, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{categoryIcons[cat]} {cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  placeholder="e.g., 2 lbs, 1 cup"
                  value={newItem.quantity}
                  onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Expiry Date (optional)</Label>
              <Input
                type="date"
                value={newItem.expiry_date}
                onChange={e => setNewItem(p => ({ ...p, expiry_date: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                Add to Pantry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}