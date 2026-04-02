import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, Video, Sparkles, ChefHat, Calendar, ShoppingCart, TrendingUp, User, MessageCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'getting_started',
      title: 'Getting Started',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      guides: [
        {
          title: 'Setting Up Your Profile',
          description: 'Complete your profile to get personalized recommendations',
          steps: [
            'Click on "My Profile" in the sidebar',
            'Fill in your personal information (age, gender, height, weight)',
            'Select your primary health goal (e.g., Liver Health, Weight Loss)',
            'Add any allergens you need to avoid',
            'Set your dietary restrictions and food preferences',
            'Choose your cooking skill level and available time',
            'Save your preferences - these will be used for all meal plan generations!',
          ],
          tips: [
            'Be specific about allergens - the AI will strictly avoid them',
            'Update your preferences as your goals change',
            'The more details you provide, the better your recommendations',
          ],
        },
        {
          title: 'Taking the Interactive Tour',
          description: 'Learn the platform with our guided tour',
          steps: [
            'The tour starts automatically for new users',
            'Follow the highlighted tooltips to learn about each feature',
            'You can skip the tour anytime by clicking "Skip Tour"',
            'To restart the tour, click the button below:',
          ],
          action: {
            label: 'Restart Tour',
            onClick: () => {
              localStorage.removeItem('vitaplate_tour_completed');
              window.location.href = '/Dashboard';
            },
          },
        },
      ],
    },
    {
      id: 'meal_planning',
      title: 'Meal Planning',
      icon: Calendar,
      color: 'from-emerald-500 to-teal-500',
      guides: [
        {
          title: 'Generating Your First Meal Plan',
          description: 'Create a personalized meal plan in minutes',
          steps: [
            'Go to "Health Diet Hub" from the sidebar',
            'Your profile preferences will auto-populate (if you set them)',
            'Select your health goal and cultural cuisine style',
            'Choose plan duration (1 day, 3 days, or 7 days)',
            'Set number of people and budget',
            'Add any specific foods you like or want to avoid',
            'Click "Generate Meal Plan" and wait ~30 seconds',
            'Review your plan with complete recipes and nutrition info',
            'Save the plan to access it later from "Meal Plans"',
          ],
          tips: [
            'Use cultural styles for authentic cuisine experiences',
            'Budget estimates are real-time from grocery stores',
            'Generated images may take a moment - you can regenerate them',
          ],
        },
        {
          title: 'Customizing Meal Plans',
          description: 'Edit and personalize your saved plans',
          steps: [
            'Go to "Meal Plans" to see all your saved plans',
            'Click on any plan to open the detailed view',
            'Use "Detailed View" to see complete recipes with images',
            'Click "Regenerate" on any meal to get a new option',
            'Drag and drop meals between days to rearrange',
            'Add recipes from your favorites using "+ Add Recipe"',
            'Favorite individual meals by clicking the heart icon',
            'Share your plan with others using the share button',
          ],
        },
        {
          title: 'Understanding Nutrition Info',
          description: 'Make sense of macros and calories',
          steps: [
            'Each meal shows calories per person',
            'Macros are displayed as: P (Protein), C (Carbs), F (Fat)',
            'The plan shows daily averages at the top',
            'Total nutrition summary appears in the nutrition tab',
            'All values are automatically scaled for multiple people',
          ],
        },
      ],
    },
    {
      id: 'recipes',
      title: 'Recipes & AI Generation',
      icon: ChefHat,
      color: 'from-orange-500 to-red-500',
      guides: [
        {
          title: 'Using the AI Recipe Generator',
          description: 'Create custom recipes with AI',
          steps: [
            'Go to "AI Recipe Generator" from the sidebar',
            'Enter available ingredients you want to use',
            'Select cuisine type, dietary preferences, and meal type',
            'Choose difficulty level and cooking time',
            'Add any health focus or special requirements',
            'Click "Generate Recipe" and wait for AI to create it',
            'Review the recipe with steps, nutrition, and equipment needed',
            'Click "Generate Image" to visualize the dish',
            'Save to favorites or share with the community',
          ],
          tips: [
            'Be creative with ingredient combinations',
            'AI adapts recipes to your allergens automatically',
            'Generated recipes include grocery lists with prices',
          ],
        },
        {
          title: 'Sharing Recipes with Community',
          description: 'Contribute to the VitaPlate community',
          steps: [
            'After generating or creating a recipe, click "Share with Community"',
            'Add tags to help others discover your recipe',
            'Your recipe goes through a quick approval process',
            'Once approved, it appears in the community recipe library',
            'You can track views, likes, and comments on your recipes',
            'Manage your shared recipes from your Profile page',
          ],
        },
        {
          title: 'Browsing & Saving Community Recipes',
          description: 'Discover recipes shared by others',
          steps: [
            'Go to "Recipes" to browse community-shared recipes',
            'Use filters to find recipes by meal type, cuisine, or dietary needs',
            'Search by ingredients, tags, or recipe names',
            'Click any recipe card to view full details',
            'Save recipes to your favorites for quick access',
            'Add recipes directly to your meal plans',
            'Leave reviews and comments to help others',
          ],
        },
      ],
    },
    {
      id: 'grocery',
      title: 'Grocery Lists',
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      guides: [
        {
          title: 'Understanding Grocery Lists',
          description: 'Automatically generated shopping lists',
          steps: [
            'Every meal plan generates a grocery list automatically',
            'Items are categorized (Proteins, Vegetables, Grains, etc.)',
            'Prices are fetched from major US grocery stores in real-time',
            'Click any price to edit it manually',
            'Check off items as you shop',
            'Total cost updates as you modify quantities',
          ],
        },
        {
          title: 'Managing Grocery Lists',
          description: 'Organize and customize your shopping',
          steps: [
            'Go to "Grocery Lists" to see all your lists',
            'View lists from meal plans or create standalone lists',
            'Click "Add Item" to include custom items',
            'Adjust quantities using the +/- buttons',
            'Remove items you already have',
            'Click "Fetch Prices" to update with current costs',
            'Export to PDF or share via email/SMS',
          ],
        },
        {
          title: 'Shopping Tips',
          description: 'Get the most from your grocery lists',
          steps: [
            'Check the "Budget" filter to find affordable options',
            'Use "Aisle View" to organize by supermarket layout',
            'Enable "Show Alternatives" for substitution suggestions',
            'Save frequently used items as templates',
          ],
        },
      ],
    },
    {
      id: 'tracking',
      title: 'Nutrition Tracking',
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-500',
      guides: [
        {
          title: 'Logging Your Meals',
          description: 'Track what you eat daily',
          steps: [
            'Go to "Nutrition Tracking" from the sidebar',
            'Click "Log Meal" to add a new entry',
            'Select from your meal plans, favorites, or custom entry',
            'Choose the meal type (breakfast, lunch, dinner, snack)',
            'Adjust serving sizes if needed',
            'Your nutrition stats update automatically',
            'View daily, weekly, or monthly summaries',
          ],
        },
        {
          title: 'Setting Nutrition Goals',
          description: 'Define your daily or weekly targets',
          steps: [
            'Navigate to Nutrition Tracking page',
            'Click "Set Goals" in the top right',
            'Enter target calories and macro breakdown',
            'Choose between daily or weekly goals',
            'Your progress bars will show how you are tracking',
            'Goals are saved and persist across sessions',
          ],
        },
        {
          title: 'Viewing Progress & Analytics',
          description: 'Understand your nutrition trends',
          steps: [
            'Go to "Analytics" to see detailed charts',
            'View calorie intake over time',
            'Track macro distribution (protein, carbs, fat)',
            'See adherence to your goals with percentage metrics',
            'Export reports for sharing with healthcare providers',
          ],
        },
      ],
    },
    {
      id: 'community',
      title: 'Community & Social',
      icon: MessageCircle,
      color: 'from-pink-500 to-rose-500',
      guides: [
        {
          title: 'Joining the Community',
          description: 'Connect with other health enthusiasts',
          steps: [
            'Go to "Community" from the sidebar',
            'Browse forum posts by category',
            'Click "Create Post" to start a discussion',
            'Like, comment, and react to others\' posts',
            'Follow users you find inspiring',
            'Get notifications when people interact with your content',
          ],
        },
        {
          title: 'Sharing Your Progress',
          description: 'Celebrate your achievements',
          steps: [
            'Go to "Progress Feed" to see community wins',
            'Click "Share Progress" to post your own',
            'Include stats like streak days, goals met, etc.',
            'Add a description of your journey',
            'Receive encouragement from the community',
            'Your progress inspires others!',
          ],
        },
      ],
    },
  ];

  const faqs = [
    {
      question: 'How accurate are the calorie and nutrition estimates?',
      answer: 'Our AI uses USDA and nutritional databases to calculate accurate estimates. Values are per person and clearly labeled. For precise tracking, always verify with product labels.',
    },
    {
      question: 'Can I use the app if I have severe food allergies?',
      answer: 'Yes! Set your allergens in your profile, and the AI will NEVER include them in any meal plan or recipe. We take allergen safety very seriously.',
    },
    {
      question: 'How does the AI generate meal plans?',
      answer: 'Our AI considers your health goals, dietary restrictions, preferences, budget, and available time to create personalized plans. It uses real-time data for grocery prices and nutritional info.',
    },
    {
      question: 'Are grocery prices accurate?',
      answer: 'Prices are fetched from major US grocery store data and updated regularly. They serve as estimates - actual prices vary by location and season. You can edit any price manually.',
    },
    {
      question: 'Can I share my meal plans with family?',
      answer: 'Absolutely! Use the share button on any meal plan to copy the link, send via email, or export as PDF. You can also share to the community for others to discover.',
    },
    {
      question: 'How do I restart the onboarding tour?',
      answer: 'Scroll up to the "Getting Started" section and click "Restart Tour" in the "Taking the Interactive Tour" guide.',
    },
    {
      question: 'What if I don\'t like a generated meal?',
      answer: 'Click "Regenerate" on any individual meal to get a new option. You can regenerate as many times as you want until you find something you love!',
    },
    {
      question: 'Can I use this app for specific diets (keto, vegan, etc.)?',
      answer: 'Yes! Set your dietary preferences in your profile. The AI supports all major diets including keto, vegan, vegetarian, paleo, Mediterranean, and more.',
    },
  ];

  const filteredCategories = categories.map(cat => ({
    ...cat,
    guides: cat.guides.filter(guide => 
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.guides.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Help Center</h1>
        <p className="text-slate-600 mt-1">Everything you need to master VitaPlate</p>
      </div>

      {/* Search */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search guides and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guides">
            <BookOpen className="w-4 h-4 mr-2" />
            Step-by-Step Guides
          </TabsTrigger>
          <TabsTrigger value="faq">
            <MessageCircle className="w-4 h-4 mr-2" />
            FAQs
          </TabsTrigger>
        </TabsList>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-6">
          {filteredCategories.map((category, catIndex) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: catIndex * 0.1 }}
              >
                <Card className="border-slate-200">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle>{category.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.guides.map((guide, idx) => (
                        <AccordionItem key={idx} value={`${category.id}-${idx}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="text-left">
                              <div className="font-semibold text-slate-900">{guide.title}</div>
                              <div className="text-sm text-slate-600 mt-1">{guide.description}</div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-4">
                              <div>
                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                  📝 Steps:
                                </h4>
                                <ol className="space-y-2">
                                  {guide.steps.map((step, stepIdx) => (
                                    <li key={stepIdx} className="flex gap-3">
                                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-semibold">
                                        {stepIdx + 1}
                                      </span>
                                      <span className="text-sm text-slate-700 pt-0.5">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>

                              {guide.tips && guide.tips.length > 0 && (
                                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                                  <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                    💡 Tips:
                                  </h4>
                                  <ul className="space-y-1">
                                    {guide.tips.map((tip, tipIdx) => (
                                      <li key={tipIdx} className="text-sm text-amber-800">
                                        • {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {guide.action && (
                                <div className="pt-2">
                                  <Button onClick={guide.action.onClick} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                                    <Play className="w-4 h-4 mr-2" />
                                    {guide.action.label}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-semibold text-slate-900">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-slate-700 leading-relaxed">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Section Placeholder */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-6 text-center">
          <Video className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Video Tutorials Coming Soon!</h3>
          <p className="text-sm text-slate-600 mb-4">
            We're creating short video guides to help you get the most out of VitaPlate.
          </p>
          <Badge variant="secondary">In Development</Badge>
        </CardContent>
      </Card>
    </div>
  );
}