import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  ChefHat,
  Menu,
  X,
  User,
  Bell,
  Search,
  FileText,
  Users,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Zap,
  Package,
  Link2,
  Bot,
  Camera,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import NotificationBell from './components/notifications/NotificationBell';
import FeedbackButton from './components/FeedbackButton';

const navigation = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'Lab Results', href: 'LabResults', icon: FileText },
  { name: 'Health Diet Hub', href: 'HealthDietHub', icon: ChefHat },
  { name: 'AI Recipe Generator', href: 'AIRecipeGenerator', icon: Sparkles },
  { name: 'AI Coach', href: 'AICoach', icon: Bot },
  { name: 'Import Recipe', href: 'RecipeImport', icon: Link2 },
  { name: 'Meal Plans', href: 'MealPlans', icon: Calendar },
  { name: 'Nutrition Tracking', href: 'NutritionTracking', icon: TrendingUp },
  { name: 'Grocery Lists', href: 'GroceryLists', icon: ShoppingCart },
  { name: 'Pantry', href: 'Pantry', icon: Package },
  { name: 'My Progress', href: 'MyProgress', icon: Camera },
  { name: 'Progress Tracking', href: 'ProgressTracking', icon: TrendingUp },
  { name: 'Refer a Friend', href: 'ReferFriend', icon: Gift },
  { name: 'Find a Practitioner', href: 'FindPractitioner', icon: Users },
  { name: 'Community', href: 'Community', icon: Users },
  { name: 'Progress Feed', href: 'ProgressFeed', icon: TrendingUp },
  { name: 'Recipes', href: 'SharedRecipes', icon: Search },
  { name: 'Analytics', href: 'Analytics', icon: BarChart3 },
  { name: 'Help Center', href: 'HelpCenter', icon: MessageSquare },
  { name: 'My Profile', href: 'Profile', icon: User },
  { name: 'Pricing', href: 'Pricing', icon: Zap },
  { name: 'Settings', href: 'Settings', icon: Settings },
  { name: 'Integrations', href: 'Integrations', icon: Link2 },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const isActive = (pageName) => currentPageName === pageName;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200
        transform transition-transform duration-200 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695042d8937b0c0cf7f7afd6/1812bfbf0_image.png" 
              alt="VitaPlate Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="font-semibold text-slate-900">VitaPlate</h1>
              <p className="text-xs text-slate-500">Smart Nutrition Platform</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${active 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}

            {user?.role === 'practitioner' && (
              <>
                <div className="border-t border-slate-200 my-2" />
                <Link
                  to={createPageUrl('PractitionerPortal')}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive('PractitionerPortal')
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <ChefHat className={`w-5 h-5 ${isActive('PractitionerPortal') ? 'text-purple-600' : 'text-slate-400'}`} />
                  Practitioner Portal
                </Link>
                <Link
                  to={createPageUrl('MyClients')}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive('MyClients')
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <Users className={`w-5 h-5 ${isActive('MyClients') ? 'text-purple-600' : 'text-slate-400'}`} />
                  My Clients
                </Link>
                <Link
                  to={createPageUrl('PractitionerPricing')}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive('PractitionerPricing')
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <Zap className={`w-5 h-5 ${isActive('PractitionerPricing') ? 'text-purple-600' : 'text-slate-400'}`} />
                  Upgrade Plan
                </Link>
              </>
            )}

            {user?.role === 'corporate' && (
              <>
                <div className="border-t border-slate-200 my-2" />
                <Link
                  to={createPageUrl('CorporateAdmin')}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive('CorporateAdmin')
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <Users className={`w-5 h-5 ${isActive('CorporateAdmin') ? 'text-blue-600' : 'text-slate-400'}`} />
                  Corporate Dashboard
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <div className="border-t border-slate-200 my-2" />
                <Link
                  to={createPageUrl('AdminFeedback')}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive('AdminFeedback')
                      ? 'bg-rose-50 text-rose-700' 
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <MessageSquare className={`w-5 h-5 ${isActive('AdminFeedback') ? 'text-rose-600' : 'text-slate-400'}`} />
                  Admin Feedback
                </Link>
                <Link
                  to={createPageUrl('AdminRecipeModeration')}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive('AdminRecipeModeration')
                      ? 'bg-rose-50 text-rose-700' 
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  <ChefHat className={`w-5 h-5 ${isActive('AdminRecipeModeration') ? 'text-rose-600' : 'text-slate-400'}`} />
                  Recipe Moderation
                </Link>
              </>
            )}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-700 uppercase">Need Help?</p>
            <div className="space-y-1 text-xs">
              <a href="mailto:support@vitaplate.ai" className="text-indigo-600 hover:underline block">Support: support@vitaplate.ai</a>
              <a href="mailto:hello@vitaplate.ai" className="text-indigo-600 hover:underline block">General: hello@vitaplate.ai</a>
              <a href="mailto:founder@vitaplate.ai" className="text-indigo-600 hover:underline block">Founder: founder@vitaplate.ai</a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search meals, recipes, plans..."
                  className="pl-9 w-80 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              
              <Button 
                asChild
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Link to={createPageUrl('HealthDietHub')}>
                  Create Plan
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>

        {/* Beta Feedback Button */}
        <FeedbackButton />
        </div>
        </div>
        );
        }