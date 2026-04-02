import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Loader2, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SubmitRecipeDialog({ open, onOpenChange }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [prepTime, setPrepTime] = useState('');
  const [cookingTime, setCookingTime] = useState('');
  const [servings, setServings] = useState(2);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [prepSteps, setPrepSteps] = useState(['']);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const submitRecipeMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedRecipe.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] });
      toast.success('Recipe submitted for review!');
      resetForm();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to submit recipe');
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setMealType('lunch');
    setCuisine('');
    setDifficulty('Medium');
    setPrepTime('');
    setCookingTime('');
    setServings(2);
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setIngredients(['']);
    setPrepSteps(['']);
    setTags([]);
    setNewTag('');
    setImageFile(null);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const updateIngredient = (index, value) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addStep = () => {
    setPrepSteps([...prepSteps, '']);
  };

  const updateStep = (index, value) => {
    const updated = [...prepSteps];
    updated[index] = value;
    setPrepSteps(updated);
  };

  const removeStep = (index) => {
    setPrepSteps(prepSteps.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setImageFile(result.file_url);
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const generateImage = async () => {
    if (!name) {
      toast.error('Please enter recipe name first');
      return;
    }

    setGeneratingImage(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Professional food photography of ${name}, appetizing presentation, natural lighting, high quality, restaurant style plating`
      });
      setImageFile(result.url);
      toast.success('Image generated!');
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim() || !description.trim() || ingredients.filter(i => i.trim()).length === 0 || prepSteps.filter(s => s.trim()).length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const mealData = {
      name,
      description,
      calories,
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
      ingredients: ingredients.filter(i => i.trim()),
      prepSteps: prepSteps.filter(s => s.trim()),
      prepTime,
      cookingTime,
      difficulty,
      imageUrl: imageFile
    };

    submitRecipeMutation.mutate({
      name,
      meal_type: mealType,
      description,
      meal_data: mealData,
      calories,
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
      image_url: imageFile,
      tags,
      author_name: user?.full_name || 'Anonymous',
      cuisine,
      difficulty,
      prep_time: prepTime,
      cooking_time: cookingTime,
      servings,
      ingredients: ingredients.filter(i => i.trim()),
      prep_steps: prepSteps.filter(s => s.trim()),
      status: 'pending'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Your Recipe</DialogTitle>
          <p className="text-sm text-slate-600">Share your recipe with the community. It will be reviewed before being published.</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Recipe Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Garlic Butter Shrimp Pasta"
              />
            </div>
            <div>
              <Label>Meal Type *</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your recipe..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label>Cuisine</Label>
              <Input
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g., Italian"
              />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prep Time</Label>
              <Input
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="e.g., 15 min"
              />
            </div>
            <div>
              <Label>Cook Time</Label>
              <Input
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                placeholder="e.g., 20 min"
              />
            </div>
          </div>

          <Separator />

          {/* Nutrition */}
          <div>
            <h3 className="font-semibold mb-3">Nutrition Information (per serving)</h3>
            <div className="grid md:grid-cols-5 gap-4">
              <div>
                <Label>Servings</Label>
                <Input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div>
                <Label>Calories</Label>
                <Input
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g., 450 kcal"
                />
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="e.g., 25"
                />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="e.g., 45"
                />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="e.g., 15"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Ingredients *</h3>
              <Button onClick={addIngredient} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    placeholder="e.g., 1 cup diced tomatoes"
                    className="flex-1"
                  />
                  {ingredients.length > 1 && (
                    <Button
                      onClick={() => removeIngredient(index)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Preparation Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Preparation Steps *</h3>
              <Button onClick={addStep} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Step
              </Button>
            </div>
            <div className="space-y-3">
              {prepSteps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm flex items-center justify-center font-medium mt-2">
                    {index + 1}
                  </div>
                  <Textarea
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder="Describe this step..."
                    rows={2}
                    className="flex-1"
                  />
                  {prepSteps.length > 1 && (
                    <Button
                      onClick={() => removeStep(index)}
                      size="icon"
                      variant="ghost"
                      className="mt-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <h3 className="font-semibold mb-3">Tags</h3>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags (e.g., healthy, quick, vegetarian)"
              />
              <Button onClick={addTag} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Image Upload */}
          <div>
            <h3 className="font-semibold mb-3">Recipe Image</h3>
            <div className="space-y-3">
              {imageFile && (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={imageFile} alt="Recipe" className="w-full h-64 object-cover" />
                  <Button
                    onClick={() => setImageFile(null)}
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                  >
                    Remove
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => document.getElementById('image-upload').click()}
                  variant="outline"
                  disabled={uploadingImage}
                  className="flex-1"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                <Button
                  onClick={generateImage}
                  variant="outline"
                  disabled={generatingImage || !name}
                  className="flex-1"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitRecipeMutation.isPending}
              className="flex-1"
            >
              {submitRecipeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Recipe'
              )}
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}