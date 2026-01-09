import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { AuthProvider } from './hooks/useAuth.tsx';
import { ThemeProvider } from './hooks/useTheme.tsx';
import { Toaster } from '@/components/ui/sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';

const Index = lazy(() => import('./pages/Index'));
const Auth = lazy(() => import('./pages/Auth'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const PowerUps = lazy(() => import('./pages/PowerUps'));
const AIEmployeePage = lazy(() => import('./pages/AIEmployeePage'));
const BusinessIntelligence = lazy(() => import('./pages/BusinessIntelligence'));
const BusinessProfile = lazy(() => import('./pages/BusinessProfile'));
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

// New feature pages
const AgentLogs = lazy(() => import('./pages/AgentLogs'));
const BillingPortal = lazy(() => import('./pages/BillingPortal'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const AgentScheduling = lazy(() => import('./pages/AgentScheduling'));
const AuditTrail = lazy(() => import('./pages/AuditTrail'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow bg-background pt-16">
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
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/signup" element={<Navigate to="/auth" replace />} />
                    <Route path="/signin" element={<Navigate to="/auth" replace />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/docs" element={<Docs />} />
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/status" element={<Status />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />

                    {/* Onboarding - requires auth but NOT business profile */}
                    <Route path="/onboarding" element={<ProtectedRoute requireBusinessProfile={false}><Onboarding /></ProtectedRoute>} />

                    {/* Protected Routes - require business profile */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/power-ups" element={<ProtectedRoute><PowerUps /></ProtectedRoute>} />
                    <Route path="/ai-employees/:id" element={<ProtectedRoute><AIEmployeePage /></ProtectedRoute>} />
                    <Route path="/business-intelligence" element={<ProtectedRoute><BusinessIntelligence /></ProtectedRoute>} />
                    <Route path="/business-profile" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
                    <Route path="/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
                    <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                    <Route path="/puter-integration" element={<ProtectedRoute><PuterIntegration /></ProtectedRoute>} />

                    {/* New Feature Routes */}
                    <Route path="/logs" element={<ProtectedRoute><AgentLogs /></ProtectedRoute>} />
                    <Route path="/billing" element={<ProtectedRoute><BillingPortal /></ProtectedRoute>} />
                    <Route path="/api-keys" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
                    <Route path="/scheduling" element={<ProtectedRoute><AgentScheduling /></ProtectedRoute>} />
                    <Route path="/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />

                    {/* Not Found Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </Suspense>
            </main>
            <Footer />
            <Toaster />
            <VercelAnalytics />
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
