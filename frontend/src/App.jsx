import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Index from './pages/Index';
import Pricing from './pages/Pricing';
import Onboarding from './pages/Onboarding';
import Pantry from './pages/Pantry';
import ProgressTracking from './pages/ProgressTracking';
import RecipeImport from './pages/RecipeImport';
import AICoach from './pages/AICoach';
import Integrations from './pages/Integrations';
import SupplementRecommendations from './pages/SupplementRecommendations';
import MyProgress from './pages/MyProgress';
import ReferAFriend from './pages/ReferAFriend';
import ReferralLanding from './pages/ReferralLanding';
import ScorecardView from './pages/ScorecardView';
import PractitionerPortal from './pages/PractitionerPortal';
import PractitionerSignup from './pages/PractitionerSignup';
import FindPractitioner from './pages/FindPractitioner';
import MyClients from './pages/MyClients';
import PractitionerPricing from './pages/PractitionerPricing';
import CorporateSignup from './pages/CorporateSignup';
import CorporateAdmin from './pages/CorporateAdmin';
import HealthAlerts from './pages/HealthAlerts';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import LoginPage from '@/pages/LoginPage';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { usePageTitle } from '@/lib/usePageTitle';

// ─── Public routes — no auth required ────────────────────────────────────────
// These render before any auth check so unauthenticated users can see them
const PUBLIC_PATHS = ['/', '/Pricing', '/Onboarding'];
const PUBLIC_PREFIXES = ['/refer/', '/scorecard/', '/practitioners', '/corporate'];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

// ─── Public-only wrapper (no Layout sidebar) ──────────────────────────────────
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/"                  element={<Index />} />
      <Route path="/Pricing"           element={<Pricing />} />
      <Route path="/Onboarding"        element={<Onboarding />} />
      <Route path="/refer/:code"       element={<ReferralLanding />} />
      <Route path="/scorecard/:userId" element={<ScorecardView />} />
      <Route path="/practitioners"     element={<PractitionerSignup />} />
      <Route path="/corporate"         element={<CorporateSignup />} />
      <Route path="*"                  element={<ProtectedApp />} />
    </Routes>
  );
}

const { Pages, Layout } = pagesConfig;

const LayoutWrapper = ({ children, currentPageName }) => Layout
  ? <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// ─── Protected app — requires auth ───────────────────────────────────────────
function ProtectedApp() {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') return <LoginPage />;
  }

  return (
    <>
      <PageTitleUpdater />
      <Routes>
        {/* Auto-routed pages from pages.config */}
        {Object.entries(Pages).filter(([k]) => k !== 'Index').map(([path, Page]) => (
          <Route key={path} path={`/${path}`}
            element={
              <PageErrorBoundary>
                <LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>
              </PageErrorBoundary>
            }
          />
        ))}

        {/* Explicitly-routed pages not in pages.config */}
        <Route path="/Pantry"                   element={<PageErrorBoundary><LayoutWrapper currentPageName="Pantry"><Pantry /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/ProgressTracking"         element={<PageErrorBoundary><LayoutWrapper currentPageName="ProgressTracking"><ProgressTracking /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/RecipeImport"             element={<PageErrorBoundary><LayoutWrapper currentPageName="RecipeImport"><RecipeImport /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/AICoach"                  element={<PageErrorBoundary><LayoutWrapper currentPageName="AICoach"><AICoach /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/Integrations"             element={<PageErrorBoundary><LayoutWrapper currentPageName="Integrations"><Integrations /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/SupplementRecommendations" element={<PageErrorBoundary><LayoutWrapper currentPageName="SupplementRecommendations"><SupplementRecommendations /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/MyProgress"               element={<PageErrorBoundary><LayoutWrapper currentPageName="MyProgress"><MyProgress /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/ReferFriend"              element={<PageErrorBoundary><LayoutWrapper currentPageName="ReferFriend"><ReferAFriend /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/PractitionerPortal"       element={<PageErrorBoundary><LayoutWrapper currentPageName="PractitionerPortal"><PractitionerPortal /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/MyClients"                element={<PageErrorBoundary><LayoutWrapper currentPageName="MyClients"><MyClients /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/PractitionerPricing"      element={<PageErrorBoundary><LayoutWrapper currentPageName="PractitionerPricing"><PractitionerPricing /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/FindPractitioner"         element={<PageErrorBoundary><LayoutWrapper currentPageName="FindPractitioner"><FindPractitioner /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/CorporateAdmin"           element={<PageErrorBoundary><LayoutWrapper currentPageName="CorporateAdmin"><CorporateAdmin /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/HealthAlerts"             element={<PageErrorBoundary><LayoutWrapper currentPageName="HealthAlerts"><HealthAlerts /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="/MyProfile"               element={<PageErrorBoundary><LayoutWrapper currentPageName="Settings"><Settings /></LayoutWrapper></PageErrorBoundary>} />
        <Route path="*"                         element={<PageNotFound />} />
      </Routes>
    </>
  );
}

const PageTitleUpdater = () => { usePageTitle(); return null; };

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <PublicRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
