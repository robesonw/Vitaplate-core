import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Undo2, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useSubscription } from '@/lib/useSubscription';
import { Link } from 'react-router-dom';

const SWAP_STORAGE_KEY = 'vitaplate_swap_count';
const FREE_SWAP_LIMIT = 3;

function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
}

function getSwapCount() {
  try {
    const raw = localStorage.getItem(SWAP_STORAGE_KEY);
    if (!raw) return { count: 0, month: getMonthKey() };
    const parsed = JSON.parse(raw);
    if (parsed.month !== getMonthKey()) return { count: 0, month: getMonthKey() };
    return parsed;
  } catch {
    return { count: 0, month: getMonthKey() };
  }
}

function incrementSwapCount() {
  const current = getSwapCount();
  const updated = { count: current.count + 1, month: getMonthKey() };
  localStorage.setItem(SWAP_STORAGE_KEY, JSON.stringify(updated));
  return updated.count;
}

export default function SwapMealButton({
  meal,
  mealType,
  dayIndex,
  healthGoal,
  healthContext,
  allergens,
  foodsAvoided,
  pantryItems,
  usePantry,
  swapHistory,
  onSwapComplete,
}) {
  const [isSwapping, setIsSwapping] = useState(false);
  const [previousMeal, setPreviousMeal] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const undoTimerRef = useRef(null);
  const { isFree } = useSubscription();

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const handleUndo = () => {
    if (previousMeal && undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    onSwapComplete(dayIndex, mealType, previousMeal, true /* isUndo */);
    setPreviousMeal(null);
    setCanUndo(false);
    toast.success('Meal restored');
  };

  const handleSwap = async () => {
    // Free tier limit check
    if (isFree) {
      const { count } = getSwapCount();
      if (count >= FREE_SWAP_LIMIT) {
        toast.error(
          <div className="space-y-2">
            <p className="font-semibold">Swap limit reached</p>
            <p className="text-xs">Free users get {FREE_SWAP_LIMIT} swaps/month.</p>
            <Link to="/Pricing" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
              <Zap className="w-3 h-3" /> Upgrade to Pro for unlimited swaps
            </Link>
          </div>,
          { duration: 6000 }
        );
        return;
      }
    }

    setIsSwapping(true);
    setPreviousMeal(null);
    setCanUndo(false);

    // Build avoid list from history so the same meal isn't suggested again
    const recentlySwapped = swapHistory?.[`${dayIndex}-${mealType}`] || [];
    const avoidList = [meal?.name, ...recentlySwapped].filter(Boolean);

    try {
      const calText = meal?.calories ? `Similar calories to "${meal.calories}" (within ±100 calories)` : '';
      const avoidText = avoidList.length
        ? `IMPORTANT: Do NOT suggest any of these meals that were recently used: ${avoidList.join(', ')}.`
        : '';

      // Routes through /api/ai/invoke (Haiku model)
      const newMeal = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a DIFFERENT ${mealType} meal to replace "${meal?.name}" in a meal plan.
Goal: ${healthGoal}
${healthContext ? `Health context: ${healthContext}` : ''}
${calText}
${allergens?.length ? `STRICT ALLERGENS TO AVOID: ${allergens.join(', ')}` : ''}
${foodsAvoided ? `Also avoid: ${foodsAvoided}` : ''}
${usePantry && pantryItems?.length > 0 ? `Prefer using these pantry items if possible: ${pantryItems.map(i => i.name).join(', ')}` : ''}
${avoidText}
Make it nutritionally appropriate for ${mealType}, include full preparation details.`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            calories: { type: 'string' },
            protein: { type: 'number' },
            carbs: { type: 'number' },
            fat: { type: 'number' },
            healthBenefit: { type: 'string' },
            health_benefit: { type: 'string' },
            meal_tag: { type: 'string' },
            prepTime: { type: 'string' },
            difficulty: { type: 'string' },
            prepSteps: { type: 'array', items: { type: 'string' } },
            equipment: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      // Normalise healthBenefit field
      if (newMeal.health_benefit && !newMeal.healthBenefit) {
        newMeal.healthBenefit = newMeal.health_benefit;
      }

      // Store old meal for undo
      setPreviousMeal(meal);
      setCanUndo(true);

      // Track for free users
      if (isFree) incrementSwapCount();

      onSwapComplete(dayIndex, mealType, newMeal, false /* not undo */);
      toast.success(`✨ ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} swapped!`);

      // Auto-clear undo after 10 seconds
      undoTimerRef.current = setTimeout(() => {
        setCanUndo(false);
        setPreviousMeal(null);
      }, 10000);
    } catch {
      toast.error('Failed to swap meal — please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  if (canUndo) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs px-2 border-amber-300 text-amber-700 hover:bg-amber-50 animate-pulse"
        onClick={handleUndo}
      >
        <Undo2 className="w-3 h-3 mr-1" />
        Undo (10s)
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs px-2"
      onClick={handleSwap}
      disabled={isSwapping}
      title="Swap this meal for a different AI-generated option"
    >
      {isSwapping ? (
        <>
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Finding option...
        </>
      ) : (
        <>
          <RefreshCw className="w-3 h-3 mr-1" />
          🔄 Swap
        </>
      )}
    </Button>
  );
}