import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/Dashboard': 'Dashboard',
  '/LabResults': 'Lab Results',
  '/HealthDietHub': 'Health Diet Hub',
  '/AIRecipeGenerator': 'AI Recipe Generator',
  '/AICoach': 'AI Coach',
  '/RecipeImport': 'Import Recipe',
  '/MealPlans': 'Meal Plans',
  '/NutritionTracking': 'Nutrition Tracking',
  '/GroceryLists': 'Grocery Lists',
  '/Pantry': 'Pantry',
  '/MyProgress': 'My Progress',
  '/ProgressTracking': 'Progress Tracking',
  '/ReferFriend': 'Refer a Friend',
  '/FindPractitioner': 'Find a Practitioner',
  '/Community': 'Community',
  '/ProgressFeed': 'Progress Feed',
  '/Recipes': 'Recipes',
  '/SharedRecipes': 'Shared Recipes',
  '/SharedMealPlans': 'Shared Meal Plans',
  '/Analytics': 'Analytics',
  '/HelpCenter': 'Help Center',
  '/MyProfile': 'My Profile',
  '/Pricing': 'Pricing',
  '/Settings': 'Settings',
  '/Integrations': 'Integrations',
  '/Onboarding': 'Onboarding',
  '/PractitionerPortal': 'Practitioner Portal',
  '/MyClients': 'My Clients',
  '/PractitionerPricing': 'Practitioner Pricing',
  '/FindPractitioner': 'Find Practitioner',
  '/practitioners': 'Become a Practitioner',
  '/CorporateAdmin': 'Corporate Admin',
  '/corporate': 'Corporate Signup',
  '/HealthAlerts': 'Health Alerts',
  '/Forum': 'Community Forum',
};

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    let title = pageTitles[pathname] || 'VitaPlate';
    document.title = `${title} | VitaPlate`;
  }, [location.pathname]);
}