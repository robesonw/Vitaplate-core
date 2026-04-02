import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus, Check, Copy, Printer, Download, DollarSign, Loader2, Share2, Mail, MessageSquare, List, Calendar, Trash2, Save, BookOpen } from 'lucide-react';
import RetailerShopLinks, { ShopAllRetailersButton } from '../components/grocery/RetailerShopLinks';
import AffiliateOrderButtons from '../components/grocery/AffiliateOrderButtons';
import OrderFeedbackDialog from '../components/grocery/OrderFeedbackDialog';
import MealKitToggle from '../components/grocery/MealKitToggle';
import MealKitOffer from '../components/meals/MealKitOffer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { calculateListTotal } from '../utils/groceryPriceEstimates';

export default function GroceryLists() {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedStandaloneId, setSelectedStandaloneId] = useState('');
  const [listType, setListType] = useState('meal-plan'); // 'meal-plan' or 'standalone'
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [groceryList, setGroceryList] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [addingItem, setAddingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [createListDialogOpen, setCreateListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [organizationMode, setOrganizationMode] = useState('category'); // 'category' or 'aisle'
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedAffiliateClickId, setSelectedAffiliateClickId] = useState(null);

  const queryClient = useQueryClient();

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date'),
  });

  const { data: standaloneLists = [] } = useQuery({
    queryKey: ['standaloneLists'],
    queryFn: () => base44.entities.GroceryList.list('-created_date'),
  });

  const selectedPlan = mealPlans.find(p => p.id === selectedPlanId);
  const selectedStandaloneList = standaloneLists.find(l => l.id === selectedStandaloneId);

  const updatePlanMutation = useMutation({
    mutationFn: (data) => base44.entities.MealPlan.update(selectedPlanId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Grocery list updated');
    },
  });

  const createStandaloneListMutation = useMutation({
    mutationFn: (data) => base44.entities.GroceryList.create(data),
    onSuccess: (newList) => {
      queryClient.invalidateQueries({ queryKey: ['standaloneLists'] });
      setSelectedStandaloneId(newList.id);
      setListType('standalone');
      toast.success('List created');
      setCreateListDialogOpen(false);
      setNewListName('');
    },
  });

  const updateStandaloneListMutation = useMutation({
    mutationFn: (data) => base44.entities.GroceryList.update(selectedStandaloneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standaloneLists'] });
      toast.success('List updated');
    },
  });

  const deleteStandaloneListMutation = useMutation({
    mutationFn: (id) => base44.entities.GroceryList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standaloneLists'] });
      toast.success('List deleted');
      setSelectedStandaloneId('');
      setGroceryList(null);
    },
  });

  const saveAsNewListMutation = useMutation({
    mutationFn: (data) => base44.entities.GroceryList.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standaloneLists'] });
      toast.success('Grocery list saved!');
    },
    onError: () => {
      toast.error('Failed to save grocery list');
    },
  });

  const handleSaveCurrentList = () => {
    if (!groceryList) return;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const name = selectedPlan ? `${selectedPlan.name} — ${dateStr}` : `Week of ${dateStr}`;
    const allItems = Object.entries(groceryList).flatMap(([category, items]) =>
      items.map(item => ({ ...item, category }))
    );
    const total_cost = allItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    saveAsNewListMutation.mutate({ name, items: groceryList, total_cost });
  };

  const handleCreateStandaloneList = () => {
    if (!newListName.trim()) {
      toast.error('Please enter a list name');
      return;
    }

    const emptyList = {
      'Proteins': [],
      'Vegetables': [],
      'Grains': [],
      'Dairy/Alternatives': [],
      'Fruits': [],
      'Other': []
    };

    createStandaloneListMutation.mutate({
      name: newListName,
      items: emptyList,
      total_cost: 0
    });
  };

  React.useEffect(() => {
    if (listType === 'standalone' && selectedStandaloneList) {
      setGroceryList(selectedStandaloneList.items || {});
    } else if (listType === 'meal-plan' && selectedPlan?.grocery_list) {
      // Deduplicate saved grocery list
      const deduped = {};
      Object.entries(selectedPlan.grocery_list).forEach(([category, items]) => {
        const itemMap = {};
        items.forEach(item => {
          const key = item.name;
          if (itemMap[key]) {
            itemMap[key].quantity = (itemMap[key].quantity || 1) + (item.quantity || 1);
          } else {
            itemMap[key] = { ...item };
          }
        });
        deduped[category] = Object.values(itemMap);
      });
      setGroceryList(deduped);
    } else if (selectedPlan?.days) {
      // Generate from meals if not saved
      const items = new Set();
      selectedPlan.days.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
          if (day[meal]?.name) {
            const words = day[meal].name.split(/[\s,]+/);
            words.forEach(word => {
              const cleaned = word.toLowerCase();
              if (cleaned.length > 3 && !['with', 'and', 'the'].includes(cleaned)) {
                items.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
              }
            });
          }
        });
      });

      const categorized = {
        'Proteins': [],
        'Vegetables': [],
        'Grains': [],
        'Dairy/Alternatives': [],
        'Fruits': [],
        'Other': []
      };

      const proteinKeywords = ['chicken', 'beef', 'salmon', 'fish', 'liver', 'turkey', 'pork', 'lamb', 'egg', 'tofu', 'cod', 'trout', 'mackerel', 'tuna', 'shrimp'];
      const vegKeywords = ['spinach', 'broccoli', 'carrot', 'asparagus', 'onion', 'garlic', 'pepper', 'tomato', 'lettuce', 'kale', 'cabbage', 'zucchini', 'mushroom', 'artichoke', 'brussels'];
      const grainKeywords = ['rice', 'quinoa', 'oat', 'bread', 'pasta', 'tortilla', 'barley'];
      const dairyKeywords = ['yogurt', 'cheese', 'milk', 'cream', 'butter'];
      const fruitKeywords = ['berry', 'berries', 'apple', 'banana', 'orange', 'lemon', 'avocado'];

      // Group items by category and deduplicate
      const itemsByCategory = {};
      items.forEach(item => {
        const lowerItem = item.toLowerCase();
        let targetCategory = 'Other';

        if (proteinKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Proteins';
        else if (vegKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Vegetables';
        else if (fruitKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Fruits';
        else if (grainKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Grains';
        else if (dairyKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Dairy/Alternatives';

        if (!itemsByCategory[targetCategory]) {
          itemsByCategory[targetCategory] = {};
        }

        // Deduplicate by item name
        if (itemsByCategory[targetCategory][item]) {
          itemsByCategory[targetCategory][item].quantity += 1;
        } else {
          itemsByCategory[targetCategory][item] = { name: item, price: null, quantity: 1 };
        }
      });

      // Convert to array format
      Object.keys(categorized).forEach(category => {
        if (itemsByCategory[category]) {
          categorized[category] = Object.values(itemsByCategory[category]);
        }
      });

      setGroceryList(categorized);
    } else {
      setGroceryList(null);
    }
    setCheckedItems(new Set());
  }, [selectedPlan, selectedStandaloneList, listType]);

  const saveGroceryList = (updatedList) => {
    const listToSave = updatedList || groceryList;
    if (!listToSave) return;
    
    const currentTotal = Object.values(listToSave)
      .flat()
      .reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

    if (listType === 'meal-plan' && selectedPlanId) {
      updatePlanMutation.mutate({
        grocery_list: listToSave,
        current_total_cost: currentTotal
      });
    } else if (listType === 'standalone' && selectedStandaloneId) {
      updateStandaloneListMutation.mutate({
        items: listToSave,
        total_cost: currentTotal
      });
    }
  };

  const fetchItemPrice = async (itemName, category) => {
    setIsFetchingPrice(true);
    try {
      const priceData = await base44.integrations.Core.InvokeLLM({
        prompt: `Get current average grocery price in USD for: ${itemName}. Return approximate cost per typical package/unit from major US grocery stores.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            price: { type: "number" },
            unit: { type: "string" }
          }
        }
      });

      if (priceData?.price) {
        const updatedList = {
          ...groceryList,
          [category]: groceryList[category].map(item => 
            item.name === itemName 
              ? { ...item, price: priceData.price, unit: priceData.unit }
              : item
          )
        };
        setGroceryList(updatedList);
        saveGroceryList(updatedList);
      }
    } catch (error) {
      toast.error('Failed to fetch price');
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const addCustomItem = (category) => {
    if (!newItemName.trim()) return;
    
    const updatedList = {
      ...groceryList,
      [category]: [...(groceryList[category] || []), { name: newItemName.trim(), price: null, unit: '', quantity: 1, notes: '' }]
    };
    
    setGroceryList(updatedList);
    setNewItemName('');
    setAddingItem(null);
    saveGroceryList(updatedList);
    toast.success('Item added');
  };

  const toggleAllInCategory = (category) => {
    const items = groceryList[category] || [];
    const newChecked = new Set(checkedItems);
    const allChecked = items.every(item => checkedItems.has(item.name));
    
    items.forEach(item => {
      if (allChecked) {
        newChecked.delete(item.name);
      } else {
        newChecked.add(item.name);
      }
    });
    
    setCheckedItems(newChecked);
  };

  const categoryColors = {
    'Proteins': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-500' },
    'Vegetables': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-500' },
    'Grains': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-500' },
    'Dairy/Alternatives': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-500' },
    'Fruits': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-500' },
    'Other': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-500' }
  };

  const totalItems = groceryList ? Object.values(groceryList).flat().length : 0;
  const checkedCount = checkedItems.size;

  const aisleMapping = {
    'Proteins': 'Meat & Seafood',
    'Vegetables': 'Produce',
    'Fruits': 'Produce',
    'Grains': 'Bakery & Grains',
    'Dairy/Alternatives': 'Dairy & Refrigerated',
    'Other': 'Pantry & Other'
  };

  const organizedList = useMemo(() => {
    if (!groceryList) return {};
    
    if (organizationMode === 'aisle') {
      const aisleList = {};
      Object.entries(groceryList).forEach(([category, items]) => {
        const aisle = aisleMapping[category] || 'Pantry & Other';
        if (!aisleList[aisle]) aisleList[aisle] = [];
        aisleList[aisle].push(...items);
      });
      return aisleList;
    }
    
    return groceryList;
  }, [groceryList, organizationMode]);

  const formatGroceryList = (includeChecked = true) => {
    const items = Object.entries(organizedList || {})
      .map(([category, items]) => {
        const filteredItems = includeChecked 
          ? items 
          : items.filter(i => !checkedItems.has(i.name));
        
        if (filteredItems.length === 0) return '';
        
        return `${category}:\n${filteredItems.map(i => {
          const check = checkedItems.has(i.name) ? '☑' : '☐';
          const qty = i.quantity && i.quantity !== 1 ? ` (${i.quantity}${i.unit ? ' ' + i.unit : ''})` : '';
          const price = i.price ? ` - $${(i.price * (i.quantity || 1)).toFixed(2)}` : '';
          const notes = i.notes ? ` [${i.notes}]` : '';
          return `  ${check} ${i.name}${qty}${price}${notes}`;
        }).join('\n')}`;
      })
      .filter(Boolean)
      .join('\n\n');
    
    const totalCost = Object.values(groceryList || {})
      .flat()
      .reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    
    return `${items}\n\n--- Total: $${totalCost.toFixed(2)} ---`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatGroceryList());
    toast.success('Copied to clipboard');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Grocery List - ${selectedPlan?.name || 'Shopping List'}`);
    const body = encodeURIComponent(formatGroceryList());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaSMS = () => {
    const body = encodeURIComponent(formatGroceryList(false)); // Only unchecked items
    window.open(`sms:?body=${body}`, '_blank');
  };

  const downloadAsPDF = async () => {
    try {
      toast.info('Generating PDF...');
      const content = formatGroceryList();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grocery-list-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Grocery Lists</h1>
          <p className="text-slate-600 mt-1">
            Generate from meal plans or create your own custom lists
          </p>
        </div>
        <Button onClick={() => setCreateListDialogOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          New List
        </Button>
      </div>

      {/* List Type & Selector */}
      <Card className="border-slate-200">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <Button
              variant={listType === 'meal-plan' ? 'default' : 'outline'}
              onClick={() => {
                setListType('meal-plan');
                setSelectedStandaloneId('');
              }}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              From Meal Plan
            </Button>
            <Button
              variant={listType === 'standalone' ? 'default' : 'outline'}
              onClick={() => {
                setListType('standalone');
                setSelectedPlanId('');
              }}
              className="flex-1"
            >
              <List className="w-4 h-4 mr-2" />
              My Custom Lists
            </Button>
          </div>

          {listType === 'meal-plan' ? (
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choose a meal plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mealPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPlan && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={handleSaveCurrentList}
                    disabled={saveAsNewListMutation.isPending || !groceryList}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saveAsNewListMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save List
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadAsPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <Select value={selectedStandaloneId} onValueChange={setSelectedStandaloneId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choose a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {standaloneLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedStandaloneList && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadAsPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteStandaloneListMutation.mutate(selectedStandaloneId)}
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization Toggle & Quick Info */}
      {(selectedPlan || selectedStandaloneList) && groceryList && (
        <>
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-slate-900">Shopping List Ready! 🛒</h3>
                  <p className="text-sm text-slate-600">
                    {totalItems} items • {checkedCount} purchased • Organized by {organizationMode === 'category' ? 'food category' : 'store aisle'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Organize By:</Label>
                  <Select value={organizationMode} onValueChange={setOrganizationMode}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">🍎 Food Category</SelectItem>
                      <SelectItem value="aisle">🏪 Store Aisle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affiliate Order Buttons */}
          <AffiliateOrderButtons 
            groceryItems={Object.values(groceryList).flat()}
            estimatedTotal={calculateListTotal(
              Object.values(groceryList).flat(),
              Object.values(groceryList).flat().reduce((acc, item, idx) => {
                acc[idx] = item.quantity || 1;
                return acc;
              }, {})
            )}
            groceryListId={selectedStandaloneId || selectedPlanId}
          />

          {/* Meal Kit Offer */}
          <MealKitOffer 
            mealPlan={selectedPlan}
            userDietaryPreference={null}
          />

          {/* Meal Kit Toggle */}
          <MealKitToggle 
            groceryItems={Object.values(groceryList).flat()}
            onToggle={() => {}}
          />
        </>
      )}

      {/* Grocery List */}
      {(selectedPlan || selectedStandaloneList) && groceryList ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Shopping Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Items</span>
                <Badge variant="secondary" className="text-lg">
                  {totalItems}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Checked</span>
                <Badge className="bg-emerald-500 text-lg">
                  {checkedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Remaining</span>
                <Badge variant="outline" className="text-lg">
                  {totalItems - checkedCount}
                </Badge>
              </div>
              <div className="pt-2">
                <div className="text-sm text-slate-600 mb-2">Progress</div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                    style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1 text-right">
                  {totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0}% Complete
                </div>
              </div>

              <Separator />

              {/* Shop All Buttons */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">Shop Online</div>
                <ShopAllRetailersButton
                  items={Object.values(groceryList).flat().filter(i => !checkedItems.has(i.name))}
                />
                <p className="text-xs text-slate-400">Opens unchecked items on selected retailer</p>
              </div>

              <Separator />

              {/* Cost Summary */}
              {selectedPlan && (selectedPlan.estimated_cost || selectedPlan.current_total_cost) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700 mb-2">Budget Summary</div>
                  {selectedPlan.estimated_cost && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Initial Estimate:</span>
                      <span className="font-semibold">${selectedPlan.estimated_cost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Current Total:</span>
                    <span className="font-bold text-indigo-600">
                      ${Object.values(groceryList).flat().reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
                    </span>
                  </div>
                  {selectedPlan.estimated_cost && (
                    <div className="flex justify-between text-xs text-slate-500 pt-1 border-t">
                      <span>Difference:</span>
                      <span className={
                        Object.values(groceryList).flat().reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) <= selectedPlan.estimated_cost
                          ? 'text-emerald-600' : 'text-amber-600'
                      }>
                        ${(Object.values(groceryList).flat().reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) - selectedPlan.estimated_cost).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Standalone List Total */}
              {selectedStandaloneList && groceryList && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700 mb-2">Total Cost</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Current Total:</span>
                    <span className="font-bold text-indigo-600">
                      ${Object.values(groceryList).flat().reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {Object.entries(organizedList).map(([category, items]) => {
              const colors = categoryColors[category] || categoryColors['Other'];
              const allChecked = items && items.length > 0 && items.every(item => checkedItems.has(item.name));
              const isEmpty = !items || items.length === 0;
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`border ${colors.border}`}>
                    <CardHeader className={`${colors.bg} border-b ${colors.border}`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className={`${colors.text} flex items-center gap-2 text-base`}>
                          <div className={`w-3 h-3 rounded-full ${colors.badge}`} />
                          {category}
                          {!isEmpty && (
                            <Badge variant="secondary" className="ml-2">
                              {items.filter(item => checkedItems.has(item.name)).length} / {items.length}
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {!isEmpty && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAllInCategory(category)}
                              className={`h-8 text-xs ${allChecked ? 'text-emerald-600' : ''}`}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              {allChecked ? 'Uncheck All' : 'Mark All'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddingItem(category)}
                            className="h-8"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {isEmpty && addingItem !== category && (
                          <div className="text-center py-6 text-slate-400">
                            <p className="text-sm">No items yet. Click "Add Item" to get started.</p>
                          </div>
                        )}
                        {items && items.map((item, idx) => {
                          const itemName = item.name;
                          const itemPrice = item.price;
                          const itemUnit = item.unit;
                          const itemQuantity = item.quantity || 1;
                          const itemNotes = item.notes || '';
                          const totalPrice = (itemPrice || 0) * itemQuantity;

                          return (
                            <div key={idx} className={`p-3 rounded-lg transition-all ${
                              checkedItems.has(itemName) ? 'bg-emerald-50/50' : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                            }`}>
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  checked={checkedItems.has(itemName)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(checkedItems);
                                    if (checked) newSet.add(itemName);
                                    else newSet.delete(itemName);
                                    setCheckedItems(newSet);
                                  }}
                                  className={checkedItems.has(itemName) ? 'data-[state=checked]:bg-emerald-600' : ''}
                                />
                                <div className="flex-1">
                                  <span className={`text-sm font-medium block ${
                                    checkedItems.has(itemName) ? 'line-through text-slate-400' : 'text-slate-800'
                                  }`}>
                                    {itemName}
                                  </span>
                                  {itemNotes && !checkedItems.has(itemName) && (
                                    <span className="text-xs text-slate-500 italic block mt-0.5">
                                      💡 {itemNotes}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Quantity Input */}
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0.1"
                                  value={itemQuantity}
                                  onChange={(e) => {
                                    const newQty = parseFloat(e.target.value);
                                    if (!isNaN(newQty) && newQty > 0) {
                                      const updatedList = {
                                        ...groceryList,
                                        [category]: groceryList[category].map((it, i) => 
                                          i === idx ? { ...it, quantity: newQty } : it
                                        )
                                      };
                                      setGroceryList(updatedList);
                                      saveGroceryList(updatedList);
                                    }
                                  }}
                                  className="w-14 h-7 text-xs text-center"
                                />
                                
                                {/* Unit Input */}
                                {editingUnit === `${category}-${idx}` ? (
                                  <Input
                                    type="text"
                                    defaultValue={itemUnit || ''}
                                    placeholder="unit"
                                    className="w-20 h-7 text-xs"
                                    onBlur={(e) => {
                                      const updatedList = {
                                        ...groceryList,
                                        [category]: groceryList[category].map((it, i) => 
                                          i === idx ? { ...it, unit: e.target.value } : it
                                        )
                                      };
                                      setGroceryList(updatedList);
                                      saveGroceryList(updatedList);
                                      setEditingUnit(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') e.target.blur();
                                      if (e.key === 'Escape') setEditingUnit(null);
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    onClick={() => setEditingUnit(`${category}-${idx}`)}
                                    className="text-xs text-slate-500 hover:text-indigo-600 w-20 text-center"
                                  >
                                    {itemUnit || 'unit'}
                                  </button>
                                )}
                                
                                {/* Price Input */}
                                {editingPrice === `${category}-${idx}` ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    defaultValue={itemPrice || ''}
                                    placeholder="$"
                                    className="w-20 h-7 text-xs"
                                    onBlur={(e) => {
                                      const newPrice = parseFloat(e.target.value);
                                      if (!isNaN(newPrice)) {
                                        const updatedList = {
                                          ...groceryList,
                                          [category]: groceryList[category].map((it, i) => 
                                            i === idx ? { ...it, price: newPrice } : it
                                          )
                                        };
                                        setGroceryList(updatedList);
                                        saveGroceryList(updatedList);
                                      }
                                      setEditingPrice(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') e.target.blur();
                                      if (e.key === 'Escape') setEditingPrice(null);
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    onClick={() => setEditingPrice(`${category}-${idx}`)}
                                    className="text-xs text-slate-500 hover:text-indigo-600 min-w-[90px] text-right"
                                  >
                                    {itemPrice ? (
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-400">
                                          ${itemPrice.toFixed(2)}/{itemUnit || 'unit'}
                                        </span>
                                        <span className="font-semibold text-slate-700">
                                          ${totalPrice.toFixed(2)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          fetchItemPrice(itemName, category);
                                        }}
                                        className="text-indigo-600 hover:underline"
                                      >
                                        Get price
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                              
                              {/* Retailer Shop Links */}
                              <div className="mt-1.5 pl-6 flex items-center gap-2 flex-wrap">
                                <RetailerShopLinks itemName={itemName} compact />
                                <a
                                  href={`https://www.amazon.com/s?k=${encodeURIComponent(itemName)}&tag=vitaplate-20`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
                                >
                                  <span>🛒</span> Amazon Fresh
                                </a>
                                <a
                                  href={`https://www.instacart.com/store/s?k=${encodeURIComponent(itemName)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors font-medium"
                                >
                                  <span>🥦</span> Instacart
                                </a>
                              </div>

                              {/* Notes Input */}
                              {editingNotes === `${category}-${idx}` ? (
                                <Input
                                  type="text"
                                  defaultValue={itemNotes}
                                  placeholder="Add notes (e.g., organic, low-sodium)..."
                                  className="mt-2 h-7 text-xs"
                                  onBlur={(e) => {
                                    const updatedList = {
                                      ...groceryList,
                                      [category]: groceryList[category].map((it, i) => 
                                        i === idx ? { ...it, notes: e.target.value } : it
                                      )
                                    };
                                    setGroceryList(updatedList);
                                    saveGroceryList(updatedList);
                                    setEditingNotes(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.target.blur();
                                    if (e.key === 'Escape') setEditingNotes(null);
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingNotes(`${category}-${idx}`)}
                                  className="text-xs text-slate-400 hover:text-indigo-600 mt-1 pl-6"
                                >
                                  {itemNotes ? '✏️ Edit note' : '+ Add note'}
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {addingItem === category && (
                          <div className="flex gap-2 mt-2 p-3 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                            <Input
                              placeholder="Enter item name..."
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addCustomItem(category);
                                if (e.key === 'Escape') setAddingItem(null);
                              }}
                              className="h-9 text-sm bg-white"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => addCustomItem(category)} className="bg-indigo-600 hover:bg-indigo-700">
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setAddingItem(null)}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {listType === 'meal-plan' ? 'No Meal Plan Selected' : 'No List Selected'}
            </h3>
            <p className="text-slate-600">
              {listType === 'meal-plan' 
                ? 'Choose a meal plan to generate your grocery list' 
                : 'Select an existing list or create a new one'}
            </p>
          </CardContent>
        </Card>
      )}
      
      {isFetchingPrice && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 border border-slate-200">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="text-sm text-slate-700">Fetching price...</span>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Grocery List</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                copyToClipboard();
                setShareDialogOpen(false);
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                shareViaEmail();
                setShareDialogOpen(false);
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Share via Email
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                shareViaSMS();
                setShareDialogOpen(false);
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Share via SMS (Unchecked Items)
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                downloadAsPDF();
                setShareDialogOpen(false);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download as Text File
            </Button>
            <Separator />
            <div className="text-xs text-slate-500 space-y-1">
              <p>• Copy: All items with checkboxes and prices</p>
              <p>• Email: Full list with all details</p>
              <p>• SMS: Only unchecked items (what you still need)</p>
              <p>• Download: Complete list as text file</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Saved Lists Section */}
      {standaloneLists.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">My Saved Lists</h2>
            <Badge variant="secondary">{standaloneLists.length}</Badge>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standaloneLists.map((list) => {
              const allItems = list.items ? Object.values(list.items).flat() : [];
              const totalCost = list.total_cost || allItems.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
              return (
                <Card key={list.id} className="border-slate-200 hover:border-indigo-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{list.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(list.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => deleteStandaloneListMutation.mutate(list.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-slate-600">{allItems.length} items</span>
                      {totalCost > 0 && (
                        <span className="font-semibold text-indigo-600">${totalCost.toFixed(2)}</span>
                      )}
                    </div>
                    {list.notes && (
                      <p className="text-xs text-slate-500 italic mb-3">{list.notes}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setListType('standalone');
                        setSelectedStandaloneId(list.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Open List
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Feedback Dialog */}
      <OrderFeedbackDialog 
        affiliateClickId={selectedAffiliateClickId}
        isOpen={feedbackDialogOpen}
        onClose={() => {
          setFeedbackDialogOpen(false);
          setSelectedAffiliateClickId(null);
        }}
      />

      {/* Create List Dialog */}
      <Dialog open={createListDialogOpen} onOpenChange={setCreateListDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Grocery List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>List Name</Label>
              <Input
                placeholder="e.g., Weekly Groceries, Party Supplies..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateStandaloneList();
                }}
              />
            </div>
            <Button 
              onClick={handleCreateStandaloneList} 
              className="w-full"
              disabled={createStandaloneListMutation.isPending}
            >
              {createStandaloneListMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create List'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}