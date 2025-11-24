import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.tsx';
import { Toaster } from '@/components/ui/sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary.tsx';

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
const PuterFirebaseIntegration = lazy(() => import("./components/PuterFirebaseIntegration"));
const AITeamDebugger = lazy(() => import("./components/AITeamDebugger"));
const AITeamDashboard = lazy(() => import("./components/AITeamDashboard"));
const Marketplace = lazy(() => import('./pages/Marketplace'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Suspense fallback={<div>Loading...</div>}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />

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
                  <Route path="/ai-team-debugger" element={<ProtectedRoute><AITeamDebugger /></ProtectedRoute>} />
                  <Route path="/ai-team-dashboard" element={<ProtectedRoute><AITeamDashboard /></ProtectedRoute>} />
                  <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                  <Route path="/puter-firebase-integration" element={<ProtectedRoute><PuterFirebaseIntegration /></ProtectedRoute>} />

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
