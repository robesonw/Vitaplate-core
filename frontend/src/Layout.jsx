import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
  LayoutDashboard, FlaskConical, ChefHat, Bot,
  Calendar, Sparkles, Link2, ShoppingCart, Package,
  TrendingUp, BarChart3, Activity,
  Users, Rss, BookOpen, Search,
  Plug, Settings, HelpCircle, Gift, Zap,
  ChevronLeft, ChevronRight, Menu, X,
  Bell, LogOut, Crown, Shield,
  MessageSquare, FileText, UserCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import NotificationBell from './components/notifications/NotificationBell';

// ─── Navigation Structure ─────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: 'core',
    label: null, // no label — always visible
    items: [
      { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'health',
    label: 'Health Intelligence',
    accent: '#6366f1', // indigo
    items: [
      { name: 'Lab Results',      href: 'LabResults',     icon: FlaskConical, badge: 'Core' },
      { name: 'Health Diet Hub',  href: 'HealthDietHub',  icon: ChefHat, highlight: true },
      { name: 'Nova AI Coach',    href: 'AICoach',        icon: Bot },
    ],
  },
  {
    id: 'meals',
    label: 'Meal Planning',
    accent: '#10b981', // emerald
    items: [
      { name: 'Meal Plans',       href: 'MealPlans',          icon: Calendar },
      { name: 'Recipe Generator', href: 'AIRecipeGenerator',  icon: Sparkles },
      { name: 'Import Recipe',    href: 'RecipeImport',       icon: Link2 },
      { name: 'Grocery Lists',    href: 'GroceryLists',       icon: ShoppingCart },
      { name: 'Pantry',           href: 'Pantry',             icon: Package },
    ],
  },
  {
    id: 'track',
    label: 'Track & Improve',
    accent: '#f59e0b', // amber
    items: [
      { name: 'My Progress',       href: 'MyProgress',         icon: Activity },
      { name: 'Nutrition Tracking', href: 'NutritionTracking', icon: TrendingUp },
      { name: 'Analytics',          href: 'Analytics',         icon: BarChart3 },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    accent: '#8b5cf6', // violet
    items: [
      { name: 'Progress Feed',       href: 'ProgressFeed',      icon: Rss },
      { name: 'Shared Recipes',      href: 'SharedRecipes',     icon: BookOpen },
      { name: 'Find Practitioner',   href: 'FindPractitioner',  icon: UserCheck },
      { name: 'Community',           href: 'Community',         icon: Users },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    accent: '#64748b', // slate
    items: [
      { name: 'Integrations',  href: 'Integrations', icon: Plug },
      { name: 'Refer a Friend', href: 'ReferFriend',  icon: Gift },
      { name: 'Pricing',       href: 'Pricing',      icon: Zap },
      { name: 'Settings',      href: 'Settings',     icon: Settings },
      { name: 'Help Center',   href: 'HelpCenter',   icon: HelpCircle },
    ],
  },
];

// Role-specific nav items
const PRACTITIONER_ITEMS = [
  { name: 'My Clients',   href: 'MyClients',           icon: Users },
  { name: 'Portal',       href: 'PractitionerPortal',  icon: Shield },
  { name: 'Upgrade',      href: 'PractitionerPricing', icon: Crown },
];
const CORPORATE_ITEMS = [
  { name: 'Team Dashboard', href: 'CorporateAdmin', icon: BarChart3 },
];
const ADMIN_ITEMS = [
  { name: 'Feedback',    href: 'AdminFeedback',          icon: MessageSquare },
  { name: 'Moderation',  href: 'AdminRecipeModeration',  icon: FileText },
];

// ─── NavItem component ────────────────────────────────────────────────────────
function NavItem({ item, isActive, collapsed, accent, onClick }) {
  const Icon = item.icon;

  const itemContent = (
    <Link
      to={createPageUrl(item.href)}
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 rounded-lg transition-all duration-150 select-none
        ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5 w-full'}
        ${isActive
          ? 'bg-white/10 text-white'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
        }
        ${item.highlight && !isActive ? 'text-emerald-400 hover:text-emerald-300' : ''}
      `}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
          style={{ backgroundColor: accent || '#6366f1' }}
        />
      )}

      <Icon className={`flex-shrink-0 transition-colors ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${
        isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : ''
      }`} />

      {!collapsed && (
        <span className="text-sm font-medium truncate">{item.name}</span>
      )}

      {!collapsed && item.badge && (
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-medium">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700 text-xs">
            {item.name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return itemContent;
}

// ─── NavGroup component ───────────────────────────────────────────────────────
function NavGroup({ group, currentPageName, collapsed, onNavClick, isOpen, onToggle }) {
  const hasActiveItem = group.items.some(item => currentPageName === item.href);

  return (
    <div className={`${collapsed ? '' : 'space-y-0.5'}`}>
      {/* Group label */}
      {group.label && !collapsed && (
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-3 py-1.5 mt-3 mb-0.5 group"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">
            {group.label}
          </span>
          <ChevronRight className={`w-3 h-3 text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      )}

      {/* Group accent line when collapsed */}
      {collapsed && group.label && (
        <div className="my-2 mx-auto w-6 h-px" style={{ backgroundColor: group.accent + '40' }} />
      )}

      {/* Items */}
      {(isOpen || !group.label) && (
        <div className={`${collapsed ? 'flex flex-col items-center gap-1' : 'space-y-0.5'}`}>
          {group.items.map(item => (
            <NavItem
              key={item.href}
              item={item}
              isActive={currentPageName === item.href}
              collapsed={collapsed}
              accent={group.accent}
              onClick={onNavClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function Layout({ children, currentPageName }) {
  const { user: authUser, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('vp_nav_collapsed') === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => {
    // All groups open by default, or restore from storage
    try {
      const saved = localStorage.getItem('vp_nav_groups');
      return saved ? JSON.parse(saved) : { health: true, meals: true, track: true, community: true, account: true };
    } catch { return { health: true, meals: true, track: true, community: true, account: true }; }
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const effectiveUser = user || authUser;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('vp_nav_collapsed', String(next)); } catch {}
  };

  const toggleGroup = (groupId) => {
    const next = { ...openGroups, [groupId]: !openGroups[groupId] };
    setOpenGroups(next);
    try { localStorage.setItem('vp_nav_groups', JSON.stringify(next)); } catch {}
  };

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [currentPageName]);

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0f1117] border-r border-white/5">

      {/* Logo + Collapse toggle */}
      <div className={`flex items-center border-b border-white/5 ${collapsed ? 'justify-center py-4 px-2' : 'justify-between px-4 py-4'}`}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
              <span className="text-white text-sm font-black">V</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm leading-tight">VitaPlate</p>
              <p className="text-slate-500 text-xs truncate">Biomarker Nutrition</p>
            </div>
          </Link>
        )}

        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white text-sm font-black">V</span>
          </div>
        )}

        <button
          onClick={toggleCollapsed}
          className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-all ${collapsed ? 'mt-3' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav scroll area */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

        {/* Core items (Dashboard) */}
        {NAV_GROUPS[0].items.map(item => (
          <NavItem
            key={item.href}
            item={item}
            isActive={currentPageName === item.href}
            collapsed={collapsed}
            onClick={() => setMobileOpen(false)}
          />
        ))}

        {/* Main groups */}
        {NAV_GROUPS.slice(1).map(group => (
          <NavGroup
            key={group.id}
            group={group}
            currentPageName={currentPageName}
            collapsed={collapsed}
            onNavClick={() => setMobileOpen(false)}
            isOpen={openGroups[group.id] !== false}
            onToggle={() => toggleGroup(group.id)}
          />
        ))}

        {/* Role-specific sections */}
        {effectiveUser?.role === 'practitioner' && (
          <div className="mt-2">
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-500/70 px-3 py-1.5 mt-3 mb-0.5">
                Practitioner
              </p>
            )}
            {collapsed && <div className="my-2 mx-auto w-6 h-px bg-violet-500/20" />}
            <div className={collapsed ? 'flex flex-col items-center gap-1' : 'space-y-0.5'}>
              {PRACTITIONER_ITEMS.map(item => (
                <NavItem key={item.href} item={item} isActive={currentPageName === item.href}
                  collapsed={collapsed} accent="#8b5cf6" onClick={() => setMobileOpen(false)} />
              ))}
            </div>
          </div>
        )}

        {effectiveUser?.role === 'corporate' && (
          <div className="mt-2">
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500/70 px-3 py-1.5 mt-3 mb-0.5">
                Corporate
              </p>
            )}
            <div className={collapsed ? 'flex flex-col items-center gap-1' : 'space-y-0.5'}>
              {CORPORATE_ITEMS.map(item => (
                <NavItem key={item.href} item={item} isActive={currentPageName === item.href}
                  collapsed={collapsed} accent="#3b82f6" onClick={() => setMobileOpen(false)} />
              ))}
            </div>
          </div>
        )}

        {effectiveUser?.role === 'admin' && (
          <div className="mt-2">
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500/70 px-3 py-1.5 mt-3 mb-0.5">
                Admin
              </p>
            )}
            <div className={collapsed ? 'flex flex-col items-center gap-1' : 'space-y-0.5'}>
              {ADMIN_ITEMS.map(item => (
                <NavItem key={item.href} item={item} isActive={currentPageName === item.href}
                  collapsed={collapsed} accent="#ef4444" onClick={() => setMobileOpen(false)} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User profile footer */}
      <div className={`border-t border-white/5 ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Avatar className="w-8 h-8 cursor-pointer">
                    <AvatarImage src={effectiveUser?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold">
                      {effectiveUser?.full_name?.charAt(0) || effectiveUser?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                <p className="font-medium text-xs">{effectiveUser?.full_name || effectiveUser?.email}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={effectiveUser?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold">
                {effectiveUser?.full_name?.charAt(0) || effectiveUser?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate leading-tight">
                {effectiveUser?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">{effectiveUser?.email}</p>
            </div>
            <button
              onClick={() => logout?.()}
              className="flex-shrink-0 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col fixed top-0 left-0 h-full z-30
        transition-all duration-200 ease-in-out
        ${sidebarWidth}
      `}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`
        lg:hidden fixed top-0 left-0 h-full z-50 w-60
        transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${collapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">

            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Page breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-slate-400">VitaPlate</span>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-700">
                  {currentPageName?.replace(/([A-Z])/g, ' $1').trim() || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />

              <Link
                to={createPageUrl('HealthDietHub')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm shadow-indigo-500/20"
              >
                <ChefHat className="w-4 h-4" />
                <span>New Plan</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-slate-200/60 bg-white/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>© 2026 VitaPlate · AI-Powered Biomarker Nutrition</span>
            <div className="flex gap-4">
              <a href="mailto:support@vitaplate.ai" className="hover:text-slate-600 transition-colors">Support</a>
              <a href="mailto:founder@vitaplate.ai" className="hover:text-slate-600 transition-colors">Founder</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
