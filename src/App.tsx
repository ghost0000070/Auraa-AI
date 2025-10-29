import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.tsx';
import { Toaster } from '@/components/ui/sonner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import PowerUps from './pages/PowerUps';
import AIEmployees from './pages/AIEmployees';
import AIEmployeePage from './pages/AIEmployeePage';
import BusinessIntelligence from './pages/BusinessIntelligence';
import BusinessProfile from './pages/BusinessProfile';
import AITeamCoordination from './pages/AITeamCoordination';
import AITeamWorkflows from './pages/AITeamWorkflows';
import { ProtectedRoute } from './components/ProtectedRoute';
import IntegrationsPage from "./pages/IntegrationsPage";
import PuterFirebaseIntegration from "./components/PuterFirebaseIntegration"; // Import the new component
import { AITeamDebugger } from "./components/AITeamDebugger";
import AITeamDashboard from "./components/AITeamDashboard";
import Marketplace from './pages/Marketplace';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/puter-firebase-integration" element={<PuterFirebaseIntegration />} /> {/* Add the new route */}

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

            </Routes>
          </main>
          <Footer />
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
