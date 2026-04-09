import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Loader2, Heart, Users, Calendar, ShoppingCart, Save, Flame, Salad, DollarSign, AlertTriangle, RefreshCw, Utensils, Package, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import SwapMealButton from '@/components/meals/SwapMealButton';
import { useSubscription } from '@/lib/useSubscription';
import CarbBudgetTracker from '@/components/diabetes/CarbBudgetTracker';
import BloodSugarTips from '@/components/diabetes/BloodSugarTips';
import HeartHealthScore from '@/components/heart/HeartHealthScore';
import HeartMarkers from '@/components/heart/HeartMarkers';
import KidneyMetricsTracker from '@/components/kidney/KidneyMetricsTracker';
import KidneyFriendlyFoods from '@/components/kidney/KidneyFriendlyFoods';

// Small inline component to show free users how many swaps they have left
function FreeTierSwapCounter() {
  const { isFree } = useSubscription();
  if (!isFree) return null;
  const FREE_LIMIT = 3;
  try {
    const raw = localStorage.getItem('vitaplate_swap_count');
    if (!raw) return <span className="text-xs text-slate-500">🔄 {FREE_LIMIT} free swaps/month</span>;
    const parsed = JSON.parse(raw);
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    if (parsed.month !== monthKey) return <span className="text-xs text-slate-500">🔄 {FREE_LIMIT} free swaps/month</span>;
    const used = parsed.count || 0;
    const remaining = Math.max(0, FREE_LIMIT - used);
    if (remaining === 0) {
      return (
        <Link to="/Pricing" className="text-xs text-amber-600 font-medium hover:underline flex items-center gap-1">
          ⚡ Upgrade for unlimited swaps
        </Link>
      );
    }
    return <span className="text-xs text-slate-500">🔄 {remaining} free swap{remaining !== 1 ? 's' : ''} left this month</span>;
  } catch {
    return null;
  }
}

const healthGoals = [
  { value: 'liver_health', label: 'Liver Health', icon: Heart, color: 'rose' },
  { value: 'weight_loss', label: 'Weight Loss', icon: Flame, color: 'orange' },
  { value: 'blood_sugar_control', label: 'Blood Sugar Control', icon: Salad, color: 'emerald' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: Flame, color: 'blue' },
  { value: 'heart_health', label: 'Heart Health', icon: Heart, color: 'red' },
  { value: 'kidney_health', label: 'Kidney Health', icon: Heart, color: 'teal' },
  { value: 'digestive_health', label: 'Digestive Health', icon: Salad, color: 'green' },
  { value: 'energy_boost', label: 'Energy Boost', icon: Sparkles, color: 'yellow' },
  { value: 'immune_support', label: 'Immune Support', icon: Sparkles, color: 'indigo' },
  { value: 'anti_inflammatory', label: 'Anti-Inflammatory', icon: Heart, color: 'pink' },
  { value: 'bone_health', label: 'Bone Health', icon: Salad, color: 'amber' },
  { value: 'general_wellness', label: 'General Wellness', icon: Sparkles, color: 'purple' },
];

const diabetesTypes = [
  { value: 'none', label: 'No Diabetes' },
  { value: 'type_1', label: 'Type 1 Diabetes' },
  { value: 'type_2', label: 'Type 2 Diabetes' },
  { value: 'pre_diabetes', label: 'Pre-Diabetes' },
];

const heartConditions = [
  { value: 'none', label: 'None' },
  { value: 'high_cholesterol', label: 'High Cholesterol' },
  { value: 'hypertension', label: 'Hypertension' },
  { value: 'heart_disease', label: 'Heart Disease History' },
];

const kidneyConditions = [
  { value: 'none', label: 'None' },
  { value: 'ckd', label: 'Chronic Kidney Disease (CKD)' },
  { value: 'kidney_stones', label: 'Kidney Stones' },
  { value: 'dialysis', label: 'On Dialysis' },
];

const ckdStages = [
  { value: 1, label: 'Stage 1 (GFR ≥90)' },
  { value: 2, label: 'Stage 2 (GFR 60-89)' },
  { value: 3, label: 'Stage 3 (GFR 30-59)' },
  { value: 4, label: 'Stage 4 (GFR 15-29)' },
  { value: 5, label: 'Stage 5 (GFR <15)' },
];

const culturalStylesList = [
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'asian', label: 'Asian', emoji: '🍜' },
  { value: 'indian', label: 'Indian', emoji: '🍛' },
  { value: 'latin_american', label: 'Latin American', emoji: '🌮' },
  { value: 'african', label: 'African', emoji: '🥘' },
  { value: 'middle_eastern', label: 'Middle Eastern', emoji: '🧆' },
  { value: 'european', label: 'European', emoji: '🥖' },
  { value: 'fusion', label: 'Fusion', emoji: '✨' },
];

const lifeStages = [
  { value: 'general', label: 'General Adult' },
  { value: 'children', label: 'Children (Nutrient-Dense)' },
  { value: 'pregnancy', label: 'Pregnancy (Folate/Iron Focus)' },
  { value: 'seniors', label: 'Seniors (Easy Prep, Bone Health)' },
];

const groceryCategories = ['Proteins', 'Vegetables', 'Fruits', 'Grains', 'Dairy/Alternatives', 'Other'];

const commonAllergens = [
  { value: 'nuts', label: 'Nuts' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'soy', label: 'Soy' },
  { value: 'fish', label: 'Fish' },
  { value: 'sesame', label: 'Sesame' },
];

const cuisineOptions = [
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'asian', label: 'Asian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'italian', label: 'Italian' },
  { value: 'american', label: 'American' },
  { value: 'indian', label: 'Indian' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'greek', label: 'Greek' },
];

export default function HealthDietHub() {
  const [healthGoal, setHealthGoal] = useState('liver_health');
  const [diabetesType, setDiabetesType] = useState('none');
  const [heartCondition, setHeartCondition] = useState('none');
  const [kidneyCondition, setKidneyCondition] = useState('none');
  const [ckdStage, setCkdStage] = useState(3);
  const [foodsLiked, setFoodsLiked] = useState('');
  const [foodsAvoided, setFoodsAvoided] = useState('');
  const [customRequirements, setCustomRequirements] = useState('');
  const [duration, setDuration] = useState('week');
  const [numPeople, setNumPeople] = useState(1);
  const [weeklyBudget, setWeeklyBudget] = useState(100);
  const [maxBudget, setMaxBudget] = useState(500);
  const [allergens, setAllergens] = useState([]);
  const [cuisinePreferences, setCuisinePreferences] = useState([]);
  const [cookingTime, setCookingTime] = useState('any');
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [culturalStyles, setCulturalStyles] = useState([]);
  const [customCulturalStyle, setCustomCulturalStyle] = useState('');
  const [customCuisineInput, setCustomCuisineInput] = useState('');
  const [lifeStage, setLifeStage] = useState('general');
  const [usePantry, setUsePantry] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [labsOptimized, setLabsOptimized] = useState(false);
  const [labAdjustments, setLabAdjustments] = useState([]);
  const [labResultDate, setLabResultDate] = useState(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [planName, setPlanName] = useState('');
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [regeneratingImage, setRegeneratingImage] = useState(null);
  const [swappingMeal, setSwappingMeal] = useState(null);
  const [swapHistory, setSwapHistory] = useState({});

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchGroceryPrices = async (plan) => {
    if (!plan?.days) return;
    
    setIsFetchingPrices(true);
    
    const items = new Set();
    plan.days.forEach(day => {
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
        if (day[meal]?.name) {
          const words = day[meal].name.toLowerCase().split(/[\s,&]+/);
          words.forEach(word => {
            if (word.length > 3 && !['with', 'and', 'the'].includes(word)) {
              items.add(word);
            }
          });
        }
      });
    });

    const itemsList = Array.from(items).join(', ');
    
    try {
      const priceData = await base44.integrations.Core.InvokeLLM({
        prompt: `Get current average grocery prices in USD for these items (scaled for ${numPeople} people for a week): ${itemsList}. 
        Return prices as approximate cost per typical package/unit from major US grocery stores. 
        For items serving ${numPeople} people for a week, estimate quantities needed.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number", description: "Price in USD" },
                  unit: { type: "string", description: "e.g. per lb, per dozen, per bag" }
                }
              }
            }
          }
        }
      });

      if (priceData?.items) {
        const priceMap = {};
        priceData.items.forEach(item => {
          // Create multiple keys for better matching
          const itemName = item.name.toLowerCase();
          const basePrice = {
            name: item.name,
            price: item.price,
            unit: item.unit
          };
          
          // Add full name
          priceMap[itemName] = basePrice;
          
          // Add individual words (e.g., "chicken breast" -> "chicken", "breast")
          itemName.split(/[\s,]+/).forEach(word => {
            if (word.length > 3) {
              priceMap[word] = basePrice;
            }
          });
        });
        
        setGeneratedPlan(prev => ({
          ...prev,
          grocery_prices: priceMap
        }));
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      toast.error('Could not fetch current prices');
    } finally {
      setIsFetchingPrices(false);
    }
  };

  const { data: userPrefs } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
    select: (data) => data?.[0] || null,
  });

  // Auto-populate form from saved preferences
  React.useEffect(() => {
    if (userPrefs) {
      if (userPrefs.health_goal) setHealthGoal(userPrefs.health_goal);
      if (userPrefs.diabetes_type) setDiabetesType(userPrefs.diabetes_type);
      if (userPrefs.heart_condition) setHeartCondition(userPrefs.heart_condition);
      if (userPrefs.kidney_condition) setKidneyCondition(userPrefs.kidney_condition);
      if (userPrefs.ckd_stage) setCkdStage(userPrefs.ckd_stage);
      if (userPrefs.foods_liked) setFoodsLiked(userPrefs.foods_liked);
      if (userPrefs.foods_avoided) setFoodsAvoided(userPrefs.foods_avoided);
      if (userPrefs.allergens) setAllergens(userPrefs.allergens);
      if (userPrefs.cuisine_preferences) {
        setCuisinePreferences(userPrefs.cuisine_preferences);
        // Also populate cultural styles from cuisine preferences
        const culturalMapping = {
          'mediterranean': 'mediterranean',
          'greek': 'mediterranean',
          'asian': 'asian',
          'chinese': 'asian',
          'japanese': 'asian',
          'thai': 'asian',
          'vietnamese': 'asian',
          'indian': 'indian',
          'mexican': 'latin_american',
          'middle_eastern': 'middle_eastern',
          'italian': 'european',
          'french': 'european',
          'spanish': 'european',
          'african': 'african'
        };
        const styles = new Set();
        userPrefs.cuisine_preferences.forEach(cuisine => {
          const style = culturalMapping[cuisine];
          if (style) styles.add(style);
        });
        if (styles.size > 0) setCulturalStyles(Array.from(styles));
      }
      if (userPrefs.cooking_time) setCookingTime(userPrefs.cooking_time);
      if (userPrefs.skill_level) setSkillLevel(userPrefs.skill_level);
      if (userPrefs.num_people) setNumPeople(userPrefs.num_people);
      if (userPrefs.weekly_budget) setWeeklyBudget(userPrefs.weekly_budget);
      if (userPrefs.dietary_restrictions) setCustomRequirements(userPrefs.dietary_restrictions);
      toast.success('Loaded your profile preferences!', { duration: 2000 });
    }
  }, [userPrefs]);

  const { data: labResults = [] } = useQuery({
    queryKey: ['labResults'],
    queryFn: () => base44.entities.LabResult.list('-upload_date'),
  });

  const { data: pantryItems = [] } = useQuery({
    queryKey: ['pantryItems'],
    queryFn: () => base44.entities.PantryItem.list(),
  });

  const savePlanMutation = useMutation({
    mutationFn: (planData) => base44.entities.MealPlan.create(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal plan saved successfully!');
    },
  });

  const getHealthContext = () => {
    if (!labResults.length) return { text: '', abnormals: [], rules: [], labDate: null };
    
    const latest = labResults[0];
    const abnormals = [];
    const dietaryGuidance = [];
    const rules = []; // condition-based rules for prompt

    const b = latest.biomarkers || {};

    // Helper: find a biomarker value by multiple possible keys
    const findVal = (keys) => {
      for (const k of keys) {
        const exact = b[k]?.value;
        if (exact != null) return { value: exact, status: b[k].status };
        const ci = Object.keys(b).find(bk => bk.toLowerCase() === k.toLowerCase());
        if (ci && b[ci]?.value != null) return { value: b[ci].value, status: b[ci].status };
      }
      return null;
    };

    // --- Existing markers ---
    if (b.ALT?.status === 'high' || b.AST?.status === 'high') {
      abnormals.push('elevated liver enzymes (ALT/AST)');
      dietaryGuidance.push('liver-friendly foods (leafy greens, beets, cruciferous vegetables), avoid saturated fats and alcohol');
      rules.push('Include cruciferous vegetables, beets, and leafy greens in meals to support liver detoxification. Avoid fried foods and high-saturated-fat dishes.');
    }
    if (b.Glucose?.status === 'high') {
      abnormals.push('high blood glucose');
      dietaryGuidance.push('low-glycemic foods, high fiber, limit refined carbs and sugars');
      rules.push('HIGH BLOOD GLUCOSE: Use low-glycemic index carbohydrates (lentils, legumes, non-starchy vegetables). Avoid white rice, white bread, sugary foods. Include cinnamon and berberine-supporting foods.');
    }
    if (b.Glucose?.status === 'low') {
      abnormals.push('low blood glucose');
      dietaryGuidance.push('complex carbohydrates and regular snacks to stabilize blood sugar');
    }
    if (b.Sodium?.status === 'high') {
      abnormals.push('high sodium');
      dietaryGuidance.push('low-sodium meals, potassium-rich foods like bananas and sweet potatoes');
    }
    if (b.Potassium?.status === 'low') {
      abnormals.push('low potassium');
      dietaryGuidance.push('potassium-rich foods (avocado, spinach, potatoes, bananas)');
    }
    if (b.eGFR?.status === 'low' || b.BUN?.status === 'high' || b.Creatinine?.status === 'high') {
      abnormals.push('kidney stress markers');
      dietaryGuidance.push('kidney-friendly diet: limit protein to moderate levels, avoid excessive potassium/phosphorus');
    }

    // --- New markers ---
    const ldl = findVal(['LDL', 'LDL Cholesterol', 'LDL-C']);
    if (ldl && ldl.value > 130) {
      abnormals.push(`high LDL cholesterol (${ldl.value} mg/dL)`);
      rules.push('HIGH LDL: Reduce saturated fats (no fatty red meat, butter, full-fat dairy). Include soluble fiber foods (oats, beans, apples, barley). Add omega-3 rich foods (salmon, sardines, flaxseed, walnuts). Each day should include at least one high-fiber or omega-3 meal.');
    }

    const hba1c = findVal(['HbA1c', 'Hemoglobin A1c', 'A1c', 'Glycated Hemoglobin']);
    if (hba1c && hba1c.value > 5.7) {
      abnormals.push(`elevated HbA1c (${hba1c.value}%)`);
      rules.push('HIGH HbA1c: Reduce refined carbohydrates and added sugars. Prioritize low-glycemic foods. Include cinnamon, bitter melon, fenugreek, and berberine-supporting foods. Emphasize protein and healthy fat at each meal to blunt blood sugar spikes.');
    }

    const vitD = findVal(['Vitamin D', '25-OH Vitamin D', 'Vitamin D, 25-Hydroxy', '25(OH)D']);
    if (vitD && vitD.value < 30) {
      abnormals.push(`low Vitamin D (${vitD.value} ng/mL)`);
      rules.push('LOW VITAMIN D: Include fatty fish (salmon, mackerel, sardines) at least 3 times this week. Add egg yolks, fortified milk/plant milk, and mushrooms. Consider pairing with healthy fats (avocado, olive oil) to improve absorption.');
    }

    const trig = findVal(['Triglycerides', 'Triglyceride']);
    if (trig && trig.value > 150) {
      abnormals.push(`high triglycerides (${trig.value} mg/dL)`);
      rules.push('HIGH TRIGLYCERIDES: Eliminate added sugars and refined carbs. No fruit juices or sweetened beverages. Increase omega-3 fatty acids (salmon, flaxseed, chia seeds). Include fiber-rich legumes and vegetables.');
    }

    const ferritin = findVal(['Ferritin', 'Iron', 'Serum Iron', 'Serum Ferritin']);
    if (ferritin && ferritin.value < 12) {
      abnormals.push(`low iron/ferritin (${ferritin.value} ng/mL)`);
      rules.push('LOW FERRITIN/IRON: Include lean red meat, dark leafy greens (spinach, kale), lentils, and fortified cereals. Pair iron-rich foods with vitamin C (citrus, bell peppers) to enhance absorption. Avoid tea/coffee with meals as they inhibit iron absorption.');
    }

    const crp = findVal(['CRP', 'C-Reactive Protein', 'hs-CRP', 'hsCRP']);
    if (crp && crp.value > 1.0) {
      abnormals.push(`elevated CRP/inflammation (${crp.value} mg/L)`);
      rules.push('HIGH CRP INFLAMMATION: Every meal should include anti-inflammatory ingredients. Prioritize turmeric (with black pepper), ginger, berries, fatty fish, olive oil, and leafy greens. Avoid processed foods, trans fats, and refined sugars. Use herbs and spices liberally.');
    }

    const hdl = findVal(['HDL', 'HDL Cholesterol', 'HDL-C']);
    if (hdl && hdl.value < 40) {
      abnormals.push(`low HDL (${hdl.value} mg/dL)`);
      rules.push('LOW HDL: Increase healthy fats — extra virgin olive oil, avocado, nuts, and fatty fish. Include niacin-rich foods (poultry, peanuts, mushrooms). Reduce trans fats completely. Meals should support cardiovascular health and exercise-supportive nutrition.');
    }

    const tsh = findVal(['TSH', 'Thyroid Stimulating Hormone', 'Thyroid-Stimulating Hormone']);
    if (tsh && tsh.value > 4.0) {
      abnormals.push(`high TSH/hypothyroid (${tsh.value} mIU/L)`);
      rules.push('HIGH TSH (hypothyroid): Include iodine-rich foods (seaweed, fish, dairy, iodized salt). Add selenium-rich foods (Brazil nuts, tuna, eggs, sunflower seeds). Limit raw goitrogenic vegetables (broccoli, cabbage — cook them instead). Support thyroid function with zinc-rich foods.');
    }

    if (abnormals.length === 0) {
      return { text: 'All key biomarkers within normal range.', abnormals: [], rules: [], labDate: latest.upload_date };
    }

    const text = `CRITICAL HEALTH OPTIMIZATION REQUIRED based on lab results from ${latest.upload_date}:
- Abnormal markers: ${abnormals.join(', ')}
- Dietary adjustments needed: ${dietaryGuidance.join('; ')}

SPECIFIC DIETARY RULES (follow all of these):
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Every single meal MUST reflect these adjustments. Prioritize foods that correct these markers.`;

    return { text, abnormals, rules, labDate: latest.upload_date };
  };

  const handleGenerate = async () => {
    // Guard: require saved preferences
    if (!userPrefs) {
      toast.error('Complete your profile first to get a personalized plan!', { duration: 4000 });
      navigate('/Onboarding');
      return;
    }

    // Save health conditions to preferences
    if (userPrefs && (diabetesType !== userPrefs.diabetes_type || heartCondition !== userPrefs.heart_condition || kidneyCondition !== userPrefs.kidney_condition || ckdStage !== userPrefs.ckd_stage)) {
      try {
        const updateData = {};
        if (diabetesType !== userPrefs.diabetes_type) updateData.diabetes_type = diabetesType;
        if (heartCondition !== userPrefs.heart_condition) updateData.heart_condition = heartCondition;
        if (kidneyCondition !== userPrefs.kidney_condition) updateData.kidney_condition = kidneyCondition;
        if (ckdStage !== userPrefs.ckd_stage) updateData.ckd_stage = ckdStage;
        await base44.entities.UserPreferences.update(userPrefs.id, updateData);
      } catch (err) {
        console.log('Could not update health conditions');
      }
    }

    setIsGenerating(true);
    setAiError(null);

    const daysCount = duration === 'day' ? 1 : duration === '3days' ? 3 : 7;
    const { abnormals: labAbnormals, labDate } = getHealthContext();
    const hasLabOptimization = labAbnormals.length > 0;
    const goalDescription = healthGoals.find(g => g.value === healthGoal)?.label || 'General Wellness';

    // Build preferences object to send
    const preferencesPayload = {
      ...userPrefs,
      health_goal: healthGoal,
      diabetes_type: diabetesType,
      heart_condition: heartCondition,
      kidney_condition: kidneyCondition,
      ckd_stage: ckdStage,
      foods_liked: [foodsLiked, userPrefs.foods_liked].filter(Boolean).join(', '),
      foods_avoided: [foodsAvoided, userPrefs.foods_avoided].filter(Boolean).join(', '),
      allergens,
      cuisine_preferences: cuisinePreferences,
      cooking_time: cookingTime,
      skill_level: skillLevel,
      num_people: numPeople,
      weekly_budget: weeklyBudget,
      dietary_restrictions: customRequirements || userPrefs.dietary_restrictions,
      cultural_styles: customCulturalStyle.trim() ? [customCulturalStyle.trim()] : culturalStyles,
      life_stage: lifeStage,
      pantry_items: usePantry ? pantryItems.map(i => i.name) : [],
    };

    // Get latest lab result biomarkers
    const latestLabBiomarkers = labResults[0]?.biomarkers || null;

    const planNameLabel = `${goalDescription} Plan - ${new Date().toLocaleDateString()}`;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/meal-plans/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: daysCount,
          planName: planNameLabel,
          preferences: preferencesPayload,
          labResults: latestLabBiomarkers,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      const response = data.meal_plan || data;

      // Ensure we only get the exact number of days requested
      if (response?.days) {
        response.days = response.days.slice(0, daysCount);
      }

      setGeneratedPlan(response);
      setCheckedItems(new Set());

      const effectiveCulturalLabel = customCulturalStyle.trim()
        ? customCulturalStyle.trim()
        : culturalStyles.length > 0
          ? culturalStyles.map(s => culturalStylesList.find(cs => cs.value === s)?.label || s).join(' + ')
          : '';
      const culturalLabel = effectiveCulturalLabel ? ` ${effectiveCulturalLabel}` : '';
      const budgetText = weeklyBudget ? ` ($${weeklyBudget})` : '';
      const peopleText = numPeople > 1 ? ` for ${numPeople}` : '';
      setPlanName(`${goalDescription}${culturalLabel} Plan${peopleText}${budgetText} - ${new Date().toLocaleDateString()}`);

      setLabsOptimized(hasLabOptimization);
      setLabAdjustments(response?.lab_adjustments || []);
      setLabResultDate(labDate || null);

      // Fetch real grocery prices
      fetchGroceryPrices(response);

      // Generate images for meals in background
      generateMealImages(response);
    } catch (error) {
      console.error(error);
      setAiError('Could not generate your meal plan. Please try again in a moment.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMealImages = async (plan) => {
    if (!plan?.days) return;
    
    setGeneratingImages(true);
    const updatedDays = [...plan.days];
    
    try {
      // Generate images for all days
      const imagesToGenerate = [];
      for (let i = 0; i < plan.days.length; i++) {
        const day = plan.days[i];
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
          if (day[mealType]?.name) {
            imagesToGenerate.push({ dayIndex: i, mealType, mealName: day[mealType].name });
          }
        });
      }

      // Generate images (breakfast & lunch for each day to start)
      for (const { dayIndex, mealType, mealName } of imagesToGenerate.slice(0, Math.min(10, imagesToGenerate.length))) {
        try {
          const effectiveCulturalStyle = customCulturalStyle.trim() || (culturalStyle !== 'none' ? culturalStyle : '');
          const culturalContext = effectiveCulturalStyle ? `${effectiveCulturalStyle} style ` : '';
          // Use Unsplash for food images
          const result = { url: `https://source.unsplash.com/600x400/?food,meal,healthy,${encodeURIComponent(mealName || 'nutrition')}` };
          
          if (result?.url && dayIndex < plan.days.length) {
            updatedDays[dayIndex][mealType].imageUrl = result.url;
            setGeneratedPlan(prev => ({ ...prev, days: updatedDays.slice(0, plan.days.length) }));
          }
          } catch (err) {
          console.log('Image generation skipped for', mealName);
          // Set error flag so we show placeholder
          if (dayIndex < plan.days.length) {
            updatedDays[dayIndex][mealType].imageError = true;
            setGeneratedPlan(prev => ({ ...prev, days: updatedDays.slice(0, plan.days.length) }));
          }
          }
          }
          } catch (error) {
          console.log('Image generation completed with some skips');
          } finally {
          setGeneratingImages(false);
          }
          };

          const regenerateMealImage = async (dayIndex, mealType) => {
    const meal = generatedPlan.days[dayIndex][mealType];
    if (!meal?.name) return;
    
    setRegeneratingImage(`${dayIndex}-${mealType}`);
    
    try {
      const effectiveCulturalStyle = customCulturalStyle.trim() || (culturalStyle !== 'none' ? culturalStyle : '');
      const culturalContext = effectiveCulturalStyle ? `${effectiveCulturalStyle} style ` : '';
      const result = { url: `https://source.unsplash.com/600x400/?food,healthy,meal,nutrition` };
      if (result?.url) {
        const updatedDays = [...generatedPlan.days];
        updatedDays[dayIndex][mealType].imageUrl = result.url;
        updatedDays[dayIndex][mealType].imageError = false;
        setGeneratedPlan(prev => ({ ...prev, days: updatedDays }));
        toast.success('Image regenerated');
      }
    } catch (error) {
      toast.error('Failed to generate image');
      const updatedDays = [...generatedPlan.days];
      updatedDays[dayIndex][mealType].imageError = true;
      setGeneratedPlan(prev => ({ ...prev, days: updatedDays }));
    } finally {
      setRegeneratingImage(null);
    }
  };

  // Called by SwapMealButton when a swap (or undo) completes
  const handleSwapComplete = (dayIndex, mealType, newMeal, isUndo) => {
    const key = `${dayIndex}-${mealType}`;
    const updatedDays = [...generatedPlan.days];
    const oldMealName = updatedDays[dayIndex][mealType]?.name;

    updatedDays[dayIndex] = { ...updatedDays[dayIndex], [mealType]: newMeal };
    setGeneratedPlan(prev => ({ ...prev, days: updatedDays }));

    // Track swap history so same meal isn't suggested twice
    if (!isUndo && oldMealName) {
      setSwapHistory(prev => {
        const existing = prev[key] || [];
        return { ...prev, [key]: [...existing, oldMealName].slice(-5) };
      });
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan || !planName.trim()) {
      toast.error('Please enter a plan name');
      return;
    }
    
    if (!generatedPlan.days || generatedPlan.days.length === 0) {
      toast.error('Invalid meal plan data');
      return;
    }

    const currentTotalCost = generatedPlan.grocery_prices 
      ? Object.values(generatedPlan.grocery_prices).reduce((sum, item) => sum + (item.price || 0), 0)
      : null;
    
    savePlanMutation.mutate({
    name: planName,
    diet_type: 'custom',
    estimated_cost: generatedPlan.estimated_weekly_cost || null,
    current_total_cost: currentTotalCost,
    grocery_list: groceryList,
    macros: generatedPlan.average_daily_macros || null,
    cultural_style: customCulturalStyle.trim() || culturalStyles.join('+'),
    life_stage: lifeStage,
      days: generatedPlan.days.map(day => ({
        day: day.day || 'Day',
        breakfast: {
          name: day.breakfast?.name || 'Breakfast',
          calories: day.breakfast?.calories || '400 kcal',
          protein: day.breakfast?.protein,
          carbs: day.breakfast?.carbs,
          fat: day.breakfast?.fat,
          nutrients: day.breakfast?.healthBenefit || '',
          prepTip: day.breakfast?.description || '',
          prepSteps: day.breakfast?.prepSteps || [],
          prepTime: day.breakfast?.prepTime || '',
          difficulty: day.breakfast?.difficulty || '',
          equipment: day.breakfast?.equipment || [],
          healthBenefit: day.breakfast?.healthBenefit || '',
          imageUrl: day.breakfast?.imageUrl || ''
        },
        lunch: {
          name: day.lunch?.name || 'Lunch',
          calories: day.lunch?.calories || '500 kcal',
          protein: day.lunch?.protein,
          carbs: day.lunch?.carbs,
          fat: day.lunch?.fat,
          nutrients: day.lunch?.healthBenefit || '',
          prepTip: day.lunch?.description || '',
          prepSteps: day.lunch?.prepSteps || [],
          prepTime: day.lunch?.prepTime || '',
          difficulty: day.lunch?.difficulty || '',
          equipment: day.lunch?.equipment || [],
          healthBenefit: day.lunch?.healthBenefit || '',
          imageUrl: day.lunch?.imageUrl || ''
        },
        dinner: {
          name: day.dinner?.name || 'Dinner',
          calories: day.dinner?.calories || '600 kcal',
          protein: day.dinner?.protein,
          carbs: day.dinner?.carbs,
          fat: day.dinner?.fat,
          nutrients: day.dinner?.health_benefit || '',
          prepTip: day.dinner?.description || '',
          prepSteps: day.dinner?.prepSteps || [],
          prepTime: day.dinner?.prepTime || '',
          difficulty: day.dinner?.difficulty || '',
          equipment: day.dinner?.equipment || [],
          healthBenefit: day.dinner?.healthBenefit || '',
          imageUrl: day.dinner?.imageUrl || ''
        },
        snacks: {
          name: day.snacks?.name || 'Mixed nuts',
          calories: day.snacks?.calories || '150-200 kcal',
          protein: day.snacks?.protein,
          carbs: day.snacks?.carbs,
          fat: day.snacks?.fat,
          nutrients: day.snacks?.healthBenefit || 'Healthy fats',
          prepTip: day.snacks?.description || 'Portion control',
          prepSteps: day.snacks?.prepSteps || [],
          prepTime: day.snacks?.prepTime || '',
          difficulty: day.snacks?.difficulty || '',
          equipment: day.snacks?.equipment || [],
          healthBenefit: day.snacks?.healthBenefit || '',
          imageUrl: day.snacks?.imageUrl || ''
        }
      })),
      preferences: {
        health_goal: healthGoal,
        foods_liked: foodsLiked,
        foods_avoided: foodsAvoided,
        num_people: numPeople,
        weekly_budget: weeklyBudget,
        allergens: allergens
      }
    });
  };

  const generateGroceryList = () => {
    if (!generatedPlan?.days) return {};
    
    const items = new Set();
    generatedPlan.days.forEach(day => {
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

    const categorized = {};
    groceryCategories.forEach(cat => categorized[cat] = []);
    
    const proteinKeywords = ['chicken', 'beef', 'salmon', 'fish', 'liver', 'turkey', 'pork', 'lamb', 'egg', 'tofu', 'cod', 'trout', 'mackerel', 'tuna', 'shrimp'];
    const vegKeywords = ['spinach', 'broccoli', 'carrot', 'asparagus', 'onion', 'garlic', 'pepper', 'tomato', 'lettuce', 'kale', 'cabbage', 'zucchini', 'mushroom', 'artichoke', 'brussels'];
    const grainKeywords = ['rice', 'quinoa', 'oat', 'bread', 'pasta', 'tortilla', 'barley'];
    const dairyKeywords = ['yogurt', 'cheese', 'milk', 'cream', 'butter'];
    const fruitKeywords = ['berry', 'berries', 'apple', 'banana', 'orange', 'lemon', 'avocado'];

    items.forEach(item => {
      const lowerItem = item.toLowerCase();
      const itemWithPrice = generatedPlan.grocery_prices?.[lowerItem] || { name: item, price: null };
      
      if (proteinKeywords.some(k => lowerItem.includes(k))) categorized['Proteins'].push(itemWithPrice);
      else if (vegKeywords.some(k => lowerItem.includes(k))) categorized['Vegetables'].push(itemWithPrice);
      else if (fruitKeywords.some(k => lowerItem.includes(k))) categorized['Fruits'].push(itemWithPrice);
      else if (grainKeywords.some(k => lowerItem.includes(k))) categorized['Grains'].push(itemWithPrice);
      else if (dairyKeywords.some(k => lowerItem.includes(k))) categorized['Dairy/Alternatives'].push(itemWithPrice);
      else categorized['Other'].push(itemWithPrice);
    });

    return categorized;
  };

  const groceryList = generatedPlan ? generateGroceryList() : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Health Diet Hub</h1>
        <p className="text-slate-600 mt-1">
          AI-powered meal plans personalized to your health profile
        </p>
      </div>

      {/* Health Alert */}
      {labResults.length > 0 && (() => {
        const { text, abnormals } = getHealthContext();
        return (
          <Card className={`border-2 ${abnormals.length > 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FlaskConical className={`w-5 h-5 mt-0.5 ${abnormals.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${abnormals.length > 0 ? 'text-rose-900' : 'text-emerald-900'}`}>
                    {abnormals.length > 0 ? '⚠️ Lab Results Will Optimize Your Plan' : '✅ Lab Results Detected'}
                  </p>
                  {abnormals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {abnormals.map(a => (
                        <Badge key={a} className="bg-rose-100 text-rose-700 border-rose-200 text-xs">{a}</Badge>
                      ))}
                    </div>
                  )}
                  <p className={`text-xs mt-2 ${abnormals.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {abnormals.length > 0 ? 'Your meal plan will be specifically designed to address these markers.' : 'All biomarkers within normal range.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Customization Form */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Customize Your Meal Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Diabetes Type */}
          <div>
            <Label className="mb-2 block">Diabetes Status</Label>
            <Select value={diabetesType} onValueChange={setDiabetesType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {diabetesTypes.map(dt => (
                  <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {diabetesType !== 'none' && (
              <p className="text-xs text-emerald-600 mt-2">
                ✓ Diabetes mode enabled: Your meals will be designed for stable blood sugar with carb-consistent targets.
              </p>
            )}
          </div>

          {/* Heart Condition */}
          <div>
            <Label className="mb-2 block">Heart Health Concerns</Label>
            <Select value={heartCondition} onValueChange={setHeartCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {heartConditions.map(hc => (
                  <SelectItem key={hc.value} value={hc.value}>{hc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {heartCondition !== 'none' && (
              <p className="text-xs text-rose-600 mt-2">
                ✓ Heart health mode enabled: Your meals will prioritize low sodium, healthy fats, and omega-3s.
              </p>
            )}
          </div>

          {/* Kidney Condition */}
          <div>
            <Label className="mb-2 block">Kidney Health</Label>
            <Select value={kidneyCondition} onValueChange={setKidneyCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kidneyConditions.map(kc => (
                  <SelectItem key={kc.value} value={kc.value}>{kc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {kidneyCondition === 'ckd' && (
              <div className="mt-3">
                <Label className="mb-2 block text-sm">CKD Stage</Label>
                <Select value={ckdStage.toString()} onValueChange={(v) => setCkdStage(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ckdStages.map(stage => (
                      <SelectItem key={stage.value} value={stage.value.toString()}>{stage.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {kidneyCondition !== 'none' && (
              <p className="text-xs text-cyan-600 mt-2">
                ✓ Kidney mode enabled: Your meals will restrict potassium, phosphorus, and sodium.
              </p>
            )}
          </div>

          <Separator />

          {/* Health Goal */}
          <div>
            <Label className="mb-3 block">Primary Health Goal</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {healthGoals.map(goal => {
                const Icon = goal.icon;
                const selected = healthGoal === goal.value;
                return (
                  <button
                    key={goal.value}
                    onClick={() => setHealthGoal(goal.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selected 
                        ? `border-${goal.color}-500 bg-${goal.color}-50` 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 text-${goal.color}-600`} />
                    <p className="text-sm font-medium">{goal.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Cultural Style - Multiple Selection */}
          <div>
            <Label className="mb-3 block flex items-center gap-2">
              <span className="text-lg">🌍</span>
              Cultural Cuisine Styles (Select Multiple)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {culturalStylesList.map(style => (
                <button
                  key={style.value}
                  onClick={() => {
                    if (culturalStyles.includes(style.value)) {
                      setCulturalStyles(culturalStyles.filter(s => s !== style.value));
                    } else {
                      setCulturalStyles([...culturalStyles, style.value]);
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    culturalStyles.includes(style.value)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{style.emoji}</div>
                  <div className="text-sm font-medium">{style.label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Select multiple styles to blend cuisines, or leave unselected for any style
            </p>

            {/* Custom Cultural Style Input */}
            <div className="mt-3">
              <Input
                placeholder="Or specify other cuisine styles (e.g., Ethiopian, Vietnamese, Peruvian...)"
                value={customCulturalStyle}
                onChange={(e) => setCustomCulturalStyle(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Life Stage */}
          <div>
            <Label className="mb-2 block">Life Stage / Age Group</Label>
            <Select value={lifeStage} onValueChange={setLifeStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lifeStages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Cuisine Preferences */}
          <div>
            <Label className="mb-3 block">Cuisine Preferences (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {cuisineOptions.map(cuisine => (
                <div key={cuisine.value} className="flex items-center gap-2">
                  <Checkbox
                    id={cuisine.value}
                    checked={cuisinePreferences.includes(cuisine.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCuisinePreferences([...cuisinePreferences, cuisine.value]);
                      } else {
                        setCuisinePreferences(cuisinePreferences.filter(c => c !== cuisine.value));
                      }
                    }}
                  />
                  <Label htmlFor={cuisine.value} className="cursor-pointer text-sm">
                    {cuisine.label}
                  </Label>
                </div>
              ))}
            </div>

            {/* Custom Cuisine Input */}
            <div className="mt-3">
              <Input
                placeholder="Add other cuisines (comma-separated, e.g., Ethiopian, Vietnamese, Peruvian)"
                value={customCuisineInput}
                onChange={(e) => setCustomCuisineInput(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                These will be combined with your selected preferences above
              </p>
            </div>
          </div>

          {/* Cooking Time & Skill Level */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Max Cooking Time per Meal</Label>
              <Select value={cookingTime} onValueChange={setCookingTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Duration</SelectItem>
                  <SelectItem value="under_15">Under 15 minutes</SelectItem>
                  <SelectItem value="15_30">15-30 minutes</SelectItem>
                  <SelectItem value="30_60">30-60 minutes</SelectItem>
                  <SelectItem value="over_60">Over 60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Cooking Skill Level</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - Simple recipes</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Moderate complexity</SelectItem>
                  <SelectItem value="advanced">Advanced - Complex techniques</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Additional Requirements (Optional)</Label>
            <Textarea
              placeholder="Describe any specific dietary needs, health conditions, preferences, or goals in your own words... e.g., 'I need low-sodium meals because of high blood pressure' or 'I want high-protein meals for muscle building'"
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Separator />

          <div className="grid md:grid-cols-3 gap-4">
            {/* Duration */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Plan Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Single Day</SelectItem>
                  <SelectItem value="3days">3 Days</SelectItem>
                  <SelectItem value="week">Full Week (7 Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of People */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                Number of People
              </Label>
              <Select value={String(numPeople)} onValueChange={(val) => setNumPeople(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'person' : 'people'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan Budget */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                Budget for Plan Duration (for all {numPeople} {numPeople === 1 ? 'person' : 'people'}): ${weeklyBudget}
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="range"
                  min="30"
                  max={maxBudget}
                  step="10"
                  value={weeklyBudget}
                  onChange={(e) => setWeeklyBudget(Number(e.target.value))}
                  className="cursor-pointer flex-1"
                />
                <Input
                  type="number"
                  min="100"
                  max="2000"
                  step="50"
                  value={maxBudget}
                  onChange={(e) => {
                    const newMax = Number(e.target.value);
                    setMaxBudget(newMax);
                    if (weeklyBudget > newMax) setWeeklyBudget(newMax);
                  }}
                  className="w-20 h-8 text-sm"
                  placeholder="Max"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>$30</span>
                <span>${maxBudget}</span>
              </div>
            </div>
          </div>

          {/* Allergens */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Strict Allergen Restrictions
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonAllergens.map(allergen => (
                <div key={allergen.value} className="flex items-center gap-2">
                  <Checkbox
                    id={allergen.value}
                    checked={allergens.includes(allergen.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setAllergens([...allergens, allergen.value]);
                      } else {
                        setAllergens(allergens.filter(a => a !== allergen.value));
                      }
                    }}
                  />
                  <Label htmlFor={allergen.value} className="cursor-pointer text-sm">
                    {allergen.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Foods I Like</Label>
            <Textarea
              placeholder="e.g., chicken, salmon, broccoli, quinoa, berries..."
              value={foodsLiked}
              onChange={(e) => setFoodsLiked(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label>Foods to Avoid</Label>
            <Textarea
              placeholder="e.g., dairy, shellfish, gluten, red meat..."
              value={foodsAvoided}
              onChange={(e) => setFoodsAvoided(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Pantry Toggle */}
          {pantryItems.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <Package className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-900">Use Pantry Items ({pantryItems.length} items available)</p>
                <p className="text-xs text-indigo-600">Factor in what you already have to reduce grocery costs</p>
              </div>
              <button
                onClick={() => setUsePantry(p => !p)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${usePantry ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${usePantry ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Your Personalized Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Meal Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Loading State */}
      {isGenerating && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <p className="text-lg font-semibold text-indigo-900">AI is generating your personalized plan...</p>
          <p className="text-sm text-indigo-600">Building a {duration === 'day' ? '1-day' : duration === '3days' ? '3-day' : '7-day'} meal plan tailored to your health goals</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {['Analyzing your health profile', 'Selecting optimal meals', 'Calculating nutrition', 'Building grocery list'].map(step => (
              <div key={step} className="p-3 rounded-lg bg-white/70 border border-indigo-100 text-xs text-indigo-700 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Error State */}
      {aiError && !isGenerating && (
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-rose-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-rose-900 mb-1">Meal plan generation failed</p>
            <p className="text-sm text-rose-700 mb-3">{aiError}</p>
            <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100" onClick={() => setAiError(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Generated Plan Display */}
      <AnimatePresence>
        {generatedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Diabetes-specific sections */}
            {diabetesType !== 'none' && (
              <>
                <CarbBudgetTracker 
                  days={generatedPlan.days} 
                  hba1c={labResults[0]?.biomarkers?.HbA1c?.value || labResults[0]?.biomarkers?.['Hemoglobin A1c']?.value}
                />
                <BloodSugarTips />
              </>
            )}

            {/* Heart Health-specific sections */}
            {heartCondition !== 'none' && (
              <>
                <HeartMarkers labResults={labResults} />
                {generatedPlan.days[0] && <HeartHealthScore day={generatedPlan.days[0]} />}
              </>
            )}

            {/* Kidney Health-specific sections */}
            {kidneyCondition !== 'none' && (
              <>
                {generatedPlan.days[0] && <KidneyMetricsTracker day={generatedPlan.days[0]} ckdStage={ckdStage} />}
                <KidneyFriendlyFoods meals={generatedPlan.days.flatMap(d => [d.breakfast, d.lunch, d.dinner, d.snacks]).filter(Boolean)} />
              </>
            )}
            {/* Lab personalization banner */}
            {labsOptimized && (
              <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
                <div className="flex items-start gap-3">
                  <FlaskConical className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-indigo-900 text-sm">
                      🧬 This plan was personalized based on your lab results
                      {labResultDate && (
                        <span className="font-normal text-indigo-600 ml-1">
                          from {new Date(labResultDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </p>
                    {labAdjustments.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {labAdjustments.map((adj, i) => (
                          <li key={i} className="text-xs text-indigo-700 flex items-start gap-1.5">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            {adj}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No-labs nudge */}
            {!labsOptimized && labResults.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
                <FlaskConical className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-slate-600">
                  Upload your labs to get a plan tailored to your exact biomarkers.{' '}
                  <a href="/LabResults" className="text-indigo-600 font-medium hover:underline">Upload now →</a>
                </p>
              </div>
            )}

            {/* Pantry badge */}
            {usePantry && pantryItems.length > 0 && (
              <div className="flex">
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 border px-3 py-1 text-sm flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Uses {pantryItems.length} pantry items
                </Badge>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Health Notes */}
              <Card className="border-emerald-200 bg-emerald-50 md:col-span-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Health Benefits
                  </h3>
                  <p className="text-sm text-emerald-700">{generatedPlan.health_notes}</p>
                </CardContent>
              </Card>

              {/* Budget Summary */}
              {generatedPlan.estimated_weekly_cost && (
                <Card className={`border-2 ${
                  generatedPlan.estimated_weekly_cost <= weeklyBudget 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-amber-500 bg-amber-50'
                }`}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Budget
                    </h3>
                    <div className="text-2xl font-bold mb-1">
                      ${generatedPlan.estimated_weekly_cost}
                    </div>
                    <p className="text-xs">
                      {generatedPlan.estimated_weekly_cost <= weeklyBudget 
                        ? `✓ Under your $${weeklyBudget} goal` 
                        : `${Math.round(((generatedPlan.estimated_weekly_cost - weeklyBudget) / weeklyBudget) * 100)}% over budget`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Macros Summary */}
            {generatedPlan.average_daily_macros && (
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Average Daily Macros (per person)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-700">
                        {generatedPlan.average_daily_macros.protein}g
                      </div>
                      <div className="text-xs text-slate-600">Protein</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-50">
                      <div className="text-2xl font-bold text-amber-700">
                        {generatedPlan.average_daily_macros.carbs}g
                      </div>
                      <div className="text-xs text-slate-600">Carbs</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-rose-50">
                      <div className="text-2xl font-bold text-rose-700">
                        {generatedPlan.average_daily_macros.fat}g
                      </div>
                      <div className="text-xs text-slate-600">Fat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Name */}
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <Label className="mb-2 block">Plan Name</Label>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Enter a name for this meal plan..."
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleSavePlan} 
                className="flex-1"
                disabled={savePlanMutation.isPending || !planName.trim()}
              >
                {savePlanMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save This Plan
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => document.getElementById('grocery-list-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Grocery List ({Object.values(groceryList).flat().length} items)
              </Button>
            </div>

            {/* Meal Plan Days */}
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>Your Meal Plan</CardTitle>
                  <FreeTierSwapCounter />
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {generatedPlan.days?.map((day, index) => (
                    <AccordionItem key={index} value={`day-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <span className="font-semibold">{day.day}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
                            const meal = day[mealType];
                            if (!meal) return null;

                            const mealIcons = {
                              breakfast: '🌅',
                              lunch: '☀️',
                              dinner: '🌙',
                              snacks: '🍎'
                            };

                            return (
                              <div key={mealType} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                                {/* Meal Image */}
                                {(meal.imageUrl || meal.imageError !== undefined) && (
                                  <div className="relative mb-3 rounded-lg overflow-hidden bg-slate-100 group">
                                    {meal.imageUrl && !meal.imageError ? (
                                      <>
                                        <img
                                          src={meal.imageUrl}
                                          alt={meal.name}
                                          loading="lazy"
                                          className="w-full h-48 object-cover"
                                          onError={(e) => {
                                            const updatedDays = [...generatedPlan.days];
                                            updatedDays[index][mealType].imageError = true;
                                            setGeneratedPlan(prev => ({ ...prev, days: updatedDays }));
                                          }}
                                        />
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => regenerateMealImage(index, mealType)}
                                          disabled={regeneratingImage === `${index}-${mealType}`}
                                        >
                                          {regeneratingImage === `${index}-${mealType}` ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <RefreshCw className="w-3 h-3" />
                                          )}
                                        </Button>
                                      </>
                                    ) : (
                                      <div className="w-full h-48 flex flex-col items-center justify-center">
                                        <Utensils className="w-12 h-12 text-slate-300 mb-2" />
                                        <p className="text-xs text-slate-400 mb-2">Image unavailable</p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => regenerateMealImage(index, mealType)}
                                          disabled={regeneratingImage === `${index}-${mealType}`}
                                        >
                                          {regeneratingImage === `${index}-${mealType}` ? (
                                            <>
                                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="w-3 h-3 mr-1" />
                                              Generate Image
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl">{mealIcons[mealType]}</div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-slate-900 capitalize">{mealType}</h4>
                                      <div className="flex gap-2 flex-wrap items-center">
                                        <SwapMealButton
                                          meal={meal}
                                          mealType={mealType}
                                          dayIndex={index}
                                          healthGoal={healthGoals.find(g => g.value === healthGoal)?.label || 'General Wellness'}
                                          healthContext={getHealthContext().text}
                                          allergens={allergens}
                                          foodsAvoided={foodsAvoided}
                                          pantryItems={pantryItems}
                                          usePantry={usePantry}
                                          swapHistory={swapHistory}
                                          onSwapComplete={handleSwapComplete}
                                        />
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Flame className="w-3 h-3 text-orange-500" />
                                          {meal.calories}
                                        </Badge>
                                        {numPeople > 1 && (
                                          <Badge variant="outline" className="text-xs">
                                            Serves {numPeople}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <p className="font-medium text-slate-800 mb-1">{meal.name}</p>
                                    <p className="text-sm text-slate-600 mb-2">{meal.description}</p>

                                    {/* Macros if available */}
                                    {(meal.protein || meal.carbs || meal.fat) && (
                                      <div className="flex gap-3 mb-2 text-xs">
                                        {meal.protein && (
                                          <span className="text-blue-700">P: {meal.protein}g</span>
                                        )}
                                        {meal.carbs && (
                                          <span className="text-amber-700">C: {meal.carbs}g</span>
                                        )}
                                        {meal.fat && (
                                          <span className="text-rose-700">F: {meal.fat}g</span>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex flex-wrap items-start gap-2 text-xs">
                                       <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                         💚 {meal.health_benefit}
                                       </Badge>
                                       {meal.meal_tag && (
                                         <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                                           {meal.meal_tag}
                                         </Badge>
                                       )}
                                       {meal.glycemic_load && (
                                         <Badge className={`border-2 ${
                                           meal.glycemic_load === 'LOW' 
                                             ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                                             : meal.glycemic_load === 'MEDIUM'
                                             ? 'bg-amber-100 text-amber-700 border-amber-300'
                                             : 'bg-rose-100 text-rose-700 border-rose-300'
                                         }`}>
                                           {meal.glycemic_load === 'HIGH' && '⚠️ '} GL: {meal.glycemic_load}
                                         </Badge>
                                       )}
                                     </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Grocery List */}
            <Card id="grocery-list-section" className="border-slate-200">
              <CardHeader>
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Grocery List
                      {isFetchingPrices && (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      )}
                      {numPeople > 1 && (
                        <Badge variant="outline" className="ml-2">
                          Scaled for {numPeople} people
                        </Badge>
                      )}
                    </CardTitle>
                    {!isFetchingPrices && generatedPlan?.grocery_prices && (
                      <p className="text-xs text-slate-500 mt-1">
                        Prices are estimates from major US grocery stores. Click any item to adjust.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                  {!isFetchingPrices && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchGroceryPrices(generatedPlan)}
                      disabled={isFetchingPrices}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Refresh Prices
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const items = Object.entries(groceryList)
                        .filter(([_, items]) => items.length > 0)
                        .map(([category, items]) => `${category}:\n${items.map(item => {
                          const itemName = typeof item === 'string' ? item : item.name;
                          const itemPrice = typeof item === 'object' && item.price ? ` - $${item.price.toFixed(2)}` : '';
                          return `  • ${itemName}${itemPrice}`;
                        }).join('\n')}`)
                        .join('\n\n');
                      navigator.clipboard.writeText(items);
                      toast.success('Copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {groceryCategories.map(category => {
                    const items = groceryList[category] || [];
                    if (items.length === 0) return null;

                    return (
                      <div key={category}>
                        <h4 className="font-semibold text-slate-900 mb-3">{category}</h4>
                        <div className="space-y-2">
                          {items.map((item, idx) => {
                            const itemName = typeof item === 'string' ? item : item.name;
                            const itemPrice = typeof item === 'object' ? item.price : null;
                            const itemUnit = typeof item === 'object' ? item.unit : null;

                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <Checkbox
                                  checked={checkedItems.has(itemName)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(checkedItems);
                                    if (checked) newSet.add(itemName);
                                    else newSet.delete(itemName);
                                    setCheckedItems(newSet);
                                  }}
                                />
                                <span className={`text-sm capitalize flex-1 ${checkedItems.has(itemName) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                  {itemName}
                                </span>
                                {editingPrice === itemName ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    defaultValue={itemPrice || ''}
                                    placeholder="$"
                                    className="w-20 h-7 text-xs"
                                    onBlur={(e) => {
                                      const newPrice = parseFloat(e.target.value);
                                      if (!isNaN(newPrice)) {
                                        setGeneratedPlan(prev => ({
                                          ...prev,
                                          grocery_prices: {
                                            ...prev.grocery_prices,
                                            [itemName]: { name: itemName, price: newPrice, unit: itemUnit || '' }
                                          }
                                        }));
                                      }
                                      setEditingPrice(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') e.target.blur();
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    onClick={() => setEditingPrice(itemName)}
                                    className="text-xs text-slate-500 hover:text-indigo-600 min-w-[60px] text-right"
                                  >
                                    {itemPrice ? `$${itemPrice.toFixed(2)}${itemUnit ? `/${itemUnit}` : ''}` : isFetchingPrices ? '...' : 'Add price'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {checkedItems.size} of {Object.values(groceryList).flat().length} items checked
                  </span>
                  {generatedPlan?.grocery_prices && (
                    <span className="font-semibold text-slate-900">
                      Estimated Total: ${Object.values(generatedPlan.grocery_prices)
                        .reduce((sum, item) => sum + (item.price || 0), 0)
                        .toFixed(2)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}