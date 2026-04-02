import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Heart, ChefHat, ShoppingCart, Save, Loader2, CheckCircle2, Calendar, FileText, Settings, Bell, Edit, Trash2, Eye, Flame, Trophy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import StreaksAchievementsSection from '../components/streaks/StreaksAchievementsSection';
import MonthlyReportDialog from '../components/progress/MonthlyReportDialog';
import NotificationSettingsPanel from '../components/notifications/NotificationSettingsPanel';

const healthGoals = [
  { value: 'liver_health', label: 'Liver Health' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'blood_sugar_control', label: 'Blood Sugar Control' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'heart_health', label: 'Heart Health' },
  { value: 'kidney_health', label: 'Kidney Health' },
  { value: 'digestive_health', label: 'Digestive Health' },
  { value: 'energy_boost', label: 'Energy Boost' },
  { value: 'immune_support', label: 'Immune Support' },
  { value: 'anti_inflammatory', label: 'Anti-Inflammatory' },
  { value: 'bone_health', label: 'Bone Health' },
  { value: 'general_wellness', label: 'General Wellness' },
];

const allergenOptions = [
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
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'asian', label: 'Asian', emoji: '🍜' },
  { value: 'mexican', label: 'Mexican', emoji: '🌮' },
  { value: 'italian', label: 'Italian', emoji: '🍝' },
  { value: 'american', label: 'American', emoji: '🍔' },
  { value: 'indian', label: 'Indian', emoji: '🍛' },
  { value: 'middle_eastern', label: 'Middle Eastern', emoji: '🧆' },
  { value: 'greek', label: 'Greek', emoji: '🥙' },
  { value: 'chinese', label: 'Chinese', emoji: '🥢' },
  { value: 'japanese', label: 'Japanese', emoji: '🍱' },
  { value: 'thai', label: 'Thai', emoji: '🌶️' },
  { value: 'french', label: 'French', emoji: '🥖' },
  { value: 'spanish', label: 'Spanish', emoji: '🥘' },
  { value: 'caribbean', label: 'Caribbean', emoji: '🏝️' },
  { value: 'african', label: 'African', emoji: '🥘' },
  { value: 'vietnamese', label: 'Vietnamese', emoji: '🍲' },
];

const lifeStageOptions = [
  { value: 'general', label: 'General Adult' },
  { value: 'children', label: 'Children (Nutrient-Dense)' },
  { value: 'pregnancy', label: 'Pregnancy (Folate/Iron Focus)' },
  { value: 'seniors', label: 'Seniors (Easy Prep, Bone Health)' },
];

const mealTimingOptions = [
  { value: 'early_bird', label: 'Early Bird (Breakfast 6-7am)' },
  { value: 'standard', label: 'Standard (Breakfast 7-9am)' },
  { value: 'late_riser', label: 'Late Riser (Breakfast 9-11am)' },
  { value: 'intermittent_fasting', label: 'Intermittent Fasting' },
];

export default function Profile() {
  const [isSaving, setIsSaving] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['userPreferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const prefs = await base44.entities.UserPreferences.filter({ created_by: user.email });
      return prefs?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: myRecipes = [] } = useQuery({
    queryKey: ['mySharedRecipes'],
    queryFn: async () => {
      const recipes = await base44.entities.SharedRecipe.list('-created_date');
      return recipes.filter(r => r.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: allFavoriteMeals = [] } = useQuery({
    queryKey: ['favoriteMeals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.FavoriteMeal.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  // Deduplicate favorites by name and meal_type
  const favoriteMeals = React.useMemo(() => {
    const seen = new Set();
    return allFavoriteMeals.filter(meal => {
      const key = `${meal.name?.toLowerCase()}-${meal.meal_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allFavoriteMeals]);

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.MealPlan.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: userSettings } = useQuery({
    queryKey: ['userSettings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const settings = await base44.entities.UserSettings.filter({ created_by: user.email });
      return settings?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const [formData, setFormData] = React.useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    health_goal: '',
    dietary_restrictions: '',
    foods_liked: '',
    foods_avoided: '',
    allergens: [],
    cuisine_preferences: [],
    cooking_time: 'any',
    skill_level: 'intermediate',
    num_people: 1,
    weekly_budget: 100,
    life_stage: 'general',
    meal_timing: 'standard',
  });

  const [settingsData, setSettingsData] = React.useState({
    email_notifications: true,
    recipe_approved_notifications: true,
    recipe_rejected_notifications: true,
    new_follower_notifications: true,
    comment_notifications: true,
    like_notifications: false,
    weekly_summary: true,
  });

  const [editingRecipe, setEditingRecipe] = React.useState(null);
  const [viewingRecipe, setViewingRecipe] = React.useState(null);

  React.useEffect(() => {
    if (preferences) {
      setFormData({
        age: preferences.age || '',
        gender: preferences.gender || '',
        height: preferences.height || '',
        weight: preferences.weight || '',
        health_goal: preferences.health_goal || '',
        dietary_restrictions: preferences.dietary_restrictions || '',
        foods_liked: preferences.foods_liked || '',
        foods_avoided: preferences.foods_avoided || '',
        allergens: preferences.allergens || [],
        cuisine_preferences: preferences.cuisine_preferences || [],
        cooking_time: preferences.cooking_time || 'any',
        skill_level: preferences.skill_level || 'intermediate',
        num_people: preferences.num_people || 1,
        weekly_budget: preferences.weekly_budget || 100,
        life_stage: preferences.life_stage || 'general',
        meal_timing: preferences.meal_timing || 'standard',
      });
    }
  }, [preferences]);

  React.useEffect(() => {
    if (userSettings) {
      setSettingsData({
        email_notifications: userSettings.email_notifications ?? true,
        recipe_approved_notifications: userSettings.recipe_approved_notifications ?? true,
        recipe_rejected_notifications: userSettings.recipe_rejected_notifications ?? true,
        new_follower_notifications: userSettings.new_follower_notifications ?? true,
        comment_notifications: userSettings.comment_notifications ?? true,
        like_notifications: userSettings.like_notifications ?? false,
        weekly_summary: userSettings.weekly_summary ?? true,
      });
    }
  }, [userSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanData = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
      };

      if (preferences?.id) {
        await base44.entities.UserPreferences.update(preferences.id, cleanData);
      } else {
        await base44.entities.UserPreferences.create(cleanData);
      }

      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      toast.success('Profile preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save profile preferences:', error);
      toast.error('Failed to save profile preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      if (userSettings?.id) {
        await base44.entities.UserSettings.update(userSettings.id, settingsData);
      } else {
        await base44.entities.UserSettings.create(settingsData);
      }
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      toast.success('Settings saved!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecipeMutation = useMutation({
    mutationFn: (id) => base44.entities.SharedRecipe.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySharedRecipes'] });
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] });
      toast.success('Recipe deleted');
    },
    onError: (error) => {
      console.error('Failed to delete recipe:', error);
      toast.error('Failed to delete recipe');
    }
  });

  const deleteMealPlanMutation = useMutation({
    mutationFn: (id) => base44.entities.MealPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal plan deleted');
    },
    onError: (error) => {
      console.error('Failed to delete meal plan:', error);
      toast.error('Failed to delete meal plan');
    }
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: (id) => base44.entities.FavoriteMeal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteMeals'] });
      toast.success('Removed from favorites');
    },
    onError: (error) => {
      console.error('Failed to remove from favorites:', error);
      toast.error('Failed to remove from favorites');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-600 mt-1">
          Manage your personal information and preferences for personalized meal plans
        </p>
      </div>

      {/* User Info Card */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{user?.full_name || 'User'}</h2>
              <p className="text-slate-600">{user?.email}</p>
              <Badge variant="secondary" className="mt-1">
                {user?.role === 'admin' ? 'Admin' : 'User'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">
            <User className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="streaks">
            <Flame className="w-4 h-4 mr-2" />
            Streaks
          </TabsTrigger>
          <TabsTrigger value="recipes">
            <ChefHat className="w-4 h-4 mr-2" />
            My Recipes
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart className="w-4 h-4 mr-2" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="plans">
            <Calendar className="w-4 h-4 mr-2" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="personal">
            <FileText className="w-4 h-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Streaks & Achievements Tab */}
        <TabsContent value="streaks">
          <StreaksAchievementsSection />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-indigo-200 bg-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <ChefHat className="w-8 h-8 text-indigo-600" />
                    <span className="text-3xl font-bold text-indigo-900">{myRecipes.length}</span>
                  </div>
                  <p className="text-sm text-indigo-700 font-medium">Submitted Recipes</p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {myRecipes.filter(r => r.status === 'pending').length} pending review
                  </p>
                </CardContent>
              </Card>

              <Card className="border-rose-200 bg-rose-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="w-8 h-8 text-rose-600" />
                    <span className="text-3xl font-bold text-rose-900">{favoriteMeals.length}</span>
                  </div>
                  <p className="text-sm text-rose-700 font-medium">Favorite Meals</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-8 h-8 text-emerald-600" />
                    <span className="text-3xl font-bold text-emerald-900">{mealPlans.length}</span>
                  </div>
                  <p className="text-sm text-emerald-700 font-medium">Meal Plans</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Monthly Health Report
                </CardTitle>
                <CardDescription>
                  Generate a comprehensive PDF of your health metrics, nutrition, and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setReportDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <p className="text-xs text-slate-600 mt-3">
                  ✨ Download your monthly report with lab results, nutrition analysis, achievements, and goals for next month.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Recipes Tab */}
        <TabsContent value="recipes">
          <Card>
            <CardHeader>
              <CardTitle>My Submitted Recipes</CardTitle>
              <CardDescription>Recipes you've shared with the community</CardDescription>
            </CardHeader>
            <CardContent>
              {myRecipes.length === 0 ? (
                <div className="text-center py-12">
                  <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600">No recipes submitted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRecipes.map(recipe => (
                    <div key={recipe.id} className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{recipe.name}</h4>
                          <Badge className={
                            recipe.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            recipe.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-rose-100 text-rose-700'
                          }>
                            {recipe.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-1">{recipe.description}</p>
                        {recipe.moderation_notes && (
                          <p className="text-xs text-slate-500 mt-1">📝 {recipe.moderation_notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setViewingRecipe(recipe)}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        {recipe.status === 'rejected' && (
                          <Button size="sm" variant="outline" onClick={() => setEditingRecipe(recipe)}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteRecipeMutation.mutate(recipe.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Meals</CardTitle>
              <CardDescription>Your saved favorite recipes</CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteMeals.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600">No favorites yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteMeals.map(meal => (
                    <div key={meal.id} className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {meal.imageUrl && (
                          <img src={meal.imageUrl} alt={meal.name} className="w-16 h-16 object-cover rounded" />
                        )}
                        <div>
                          <h4 className="font-semibold text-slate-900">{meal.name}</h4>
                          <p className="text-sm text-slate-600 capitalize">{meal.meal_type}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deleteFavoriteMutation.mutate(meal.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meal Plans Tab */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>My Meal Plans</CardTitle>
              <CardDescription>Meal plans you've created</CardDescription>
            </CardHeader>
            <CardContent>
              {mealPlans.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600">No meal plans yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mealPlans.map(plan => (
                    <div key={plan.id} className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{plan.name}</h4>
                        <p className="text-sm text-slate-600">{plan.days?.length || 0} days</p>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => deleteMealPlanMutation.mutate(plan.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic information about you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Age</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 170"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 70"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab (Health, Cooking, Shopping) */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Health & Dietary Preferences</CardTitle>
                <CardDescription>Your health goals and dietary needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-2 block">Primary Health Goal</Label>
                  <Select value={formData.health_goal} onValueChange={(value) => setFormData({ ...formData, health_goal: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your health goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {healthGoals.map(goal => (
                        <SelectItem key={goal.value} value={goal.value}>
                          {goal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Allergens to Avoid</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {allergenOptions.map(allergen => (
                      <div key={allergen.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`pref-allergen-${allergen.value}`}
                          checked={formData.allergens.includes(allergen.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, allergens: [...formData.allergens, allergen.value] });
                            } else {
                              setFormData({ ...formData, allergens: formData.allergens.filter(a => a !== allergen.value) });
                            }
                          }}
                        />
                        <Label htmlFor={`pref-allergen-${allergen.value}`} className="cursor-pointer text-sm">
                          {allergen.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Dietary Restrictions / Special Diets</Label>
                  <Textarea
                    placeholder="e.g., vegetarian, vegan, keto, paleo, halal, kosher..."
                    value={formData.dietary_restrictions}
                    onChange={(e) => setFormData({ ...formData, dietary_restrictions: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Foods I Like</Label>
                  <Textarea
                    placeholder="e.g., chicken, salmon, broccoli, quinoa, berries..."
                    value={formData.foods_liked}
                    onChange={(e) => setFormData({ ...formData, foods_liked: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Foods to Avoid</Label>
                  <Textarea
                    placeholder="e.g., red meat, processed foods, sugar..."
                    value={formData.foods_avoided}
                    onChange={(e) => setFormData({ ...formData, foods_avoided: e.target.value })}
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Life Stage / Target Group</Label>
                    <Select value={formData.life_stage} onValueChange={(value) => setFormData({ ...formData, life_stage: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lifeStageOptions.map(stage => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">Adjusts nutrition and recipes for specific needs</p>
                  </div>

                  <div>
                    <Label className="mb-2 block">Meal Timing Preference</Label>
                    <Select value={formData.meal_timing} onValueChange={(value) => setFormData({ ...formData, meal_timing: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mealTimingOptions.map(timing => (
                          <SelectItem key={timing.value} value={timing.value}>
                            {timing.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">When you typically eat your first meal</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cooking Preferences</CardTitle>
                <CardDescription>Your cooking style and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Preferred Cuisines</Label>
                  <p className="text-xs text-slate-500 mb-3">Select cuisines you enjoy for personalized meal recommendations</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {cuisineOptions.map(cuisine => (
                      <div key={cuisine.value} className="flex items-center gap-2">
                        <Checkbox
                          id={`pref-cuisine-${cuisine.value}`}
                          checked={formData.cuisine_preferences.includes(cuisine.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, cuisine_preferences: [...formData.cuisine_preferences, cuisine.value] });
                            } else {
                              setFormData({ ...formData, cuisine_preferences: formData.cuisine_preferences.filter(c => c !== cuisine.value) });
                            }
                          }}
                        />
                        <Label htmlFor={`pref-cuisine-${cuisine.value}`} className="cursor-pointer text-sm flex items-center gap-1">
                          <span>{cuisine.emoji}</span>
                          {cuisine.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Cooking Skill Level</Label>
                    <Select value={formData.skill_level} onValueChange={(value) => setFormData({ ...formData, skill_level: value })}>
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

                  <div>
                    <Label className="mb-2 block">Max Cooking Time per Meal</Label>
                    <Select value={formData.cooking_time} onValueChange={(value) => setFormData({ ...formData, cooking_time: value })}>
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shopping Preferences</CardTitle>
                <CardDescription>Default settings for grocery planning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Number of People</Label>
                    <Select value={String(formData.num_people)} onValueChange={(value) => setFormData({ ...formData, num_people: Number(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {n === 1 ? 'person' : 'people'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">How many people you typically cook for</p>
                  </div>

                  <div>
                    <Label className="mb-2 block">Budget for Plan Duration (for all {formData.num_people} {formData.num_people === 1 ? 'person' : 'people'}): ${formData.weekly_budget}</Label>
                    <Input
                      type="range"
                      min="30"
                      max="500"
                      step="10"
                      value={formData.weekly_budget}
                      onChange={(e) => setFormData({ ...formData, weekly_budget: Number(e.target.value) })}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>$30</span>
                      <span>$500</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                  <p className="text-sm text-indigo-900">
                    💡 <strong>Tip:</strong> These preferences will be automatically used when generating new meal plans,
                    but you can always override them for individual plans.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <NotificationSettingsPanel />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-xs text-slate-500">Receive email updates</p>
                </div>
                <Checkbox
                  id="email-notifications"
                  checked={settingsData.email_notifications}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, email_notifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="recipe-approved-notifications">Recipe Approved</Label>
                  <p className="text-xs text-slate-500">When your recipe is approved</p>
                </div>
                <Checkbox
                  id="recipe-approved-notifications"
                  checked={settingsData.recipe_approved_notifications}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, recipe_approved_notifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="recipe-rejected-notifications">Recipe Rejected</Label>
                  <p className="text-xs text-slate-500">When your recipe is rejected</p>
                </div>
                <Checkbox
                  id="recipe-rejected-notifications"
                  checked={settingsData.recipe_rejected_notifications}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, recipe_rejected_notifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="new-follower-notifications">New Followers</Label>
                  <p className="text-xs text-slate-500">When someone follows you</p>
                </div>
                <Checkbox
                  id="new-follower-notifications"
                  checked={settingsData.new_follower_notifications}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, new_follower_notifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="comment-notifications">Comments</Label>
                  <p className="text-xs text-slate-500">When someone comments on your content</p>
                </div>
                <Checkbox
                  id="comment-notifications"
                  checked={settingsData.comment_notifications}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, comment_notifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="like-notifications">Likes</Label>
                  <p className="text-xs text-slate-500">When someone likes your content</p>
                </div>
                <Checkbox
                  id="like-notifications"
                  checked={settingsData.like_notifications}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, like_notifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-summary">Weekly Summary</Label>
                  <p className="text-xs text-slate-500">Get your weekly nutrition report</p>
                </div>
                <Checkbox
                  id="weekly-summary"
                  checked={settingsData.weekly_summary}
                  onCheckedChange={(checked) => setSettingsData({ ...settingsData, weekly_summary: checked })}
                />
              </div>
              <div className="pt-4">
                <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button for Profile Preferences (formData) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky bottom-6 z-10"
      >
        <Card className="border-2 border-indigo-600 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Changes are saved when you click Save Profile.
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Report Dialog */}
      <MonthlyReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        subscriptionStatus={userSettings?.subscription_plan || 'free'}
      />
    </div>
  );
}