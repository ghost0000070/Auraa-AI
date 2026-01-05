import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from '@/components/ui/sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';

const Index = lazy(() => import('./pages/Index'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const PowerUps = lazy(() => import('./pages/PowerUps'));
const AIEmployees = lazy(() => import('./pages/AIEmployees'));
const AIEmployeePage = lazy(() => import('./pages/AIEmployeePage'));
const BusinessIntelligence = lazy(() => import('./pages/BusinessIntelligence'));
const BusinessProfile = lazy(() => import('./pages/BusinessProfile'));
const AITeamCoordination = lazy(() => import('./pages/AITeamCoordination'));
const AITeamWorkflows = lazy(() => import('./pages/AITeamWorkflows'));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const PuterIntegration = lazy(() => import("./components/PuterIntegration"));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const Contact = lazy(() => import('./pages/Contact'));
const Help = lazy(() => import('./pages/Help'));
const Docs = lazy(() => import('./pages/Docs'));
const Careers = lazy(() => import('./pages/Careers'));
const Status = lazy(() => import('./pages/Status'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <main className="flex-grow bg-background">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
                <div className="text-center space-y-4">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
                  <p className="text-lg text-white">Loading...</p>
                </div>
              </div>
            }>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/status" element={<Status />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />

                  {/* Protected Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/power-ups" element={<ProtectedRoute><PowerUps /></ProtectedRoute>} />
                  <Route path="/ai-employees" element={<ProtectedRoute><AIEmployees /></ProtectedRoute>} />
                  <Route path="/ai-employees/:id" element={<ProtectedRoute><AIEmployeePage /></ProtectedRoute>} />
                  <Route path="/business-intelligence" element={<ProtectedRoute><BusinessIntelligence /></ProtectedRoute>} />
                  <Route path="/business-profile" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
                  <Route path="/ai-team-coordination" element={<ProtectedRoute><AITeamCoordination /></ProtectedRoute>} />
                  <Route path="/ai-team-workflows" element={<ProtectedRoute><AITeamWorkflows /></ProtectedRoute>} />
                  <Route path="/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
                  <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                  <Route path="/puter-integration" element={<ProtectedRoute><PuterIntegration /></ProtectedRoute>} />

                  {/* Not Found Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </main>
          <Footer />
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
