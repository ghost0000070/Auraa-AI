import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import AIEmployees from "./pages/AIEmployees";
import PowerUps from "./pages/PowerUps";
import BusinessProfile from "./pages/BusinessProfile";
import AIEmployeePage from "./pages/AIEmployeePage";
import AITeamWorkflows from "./pages/AITeamWorkflows";
import BusinessIntelligence from "./pages/BusinessIntelligence";
import AITeamCoordination from "./pages/AITeamCoordination";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import IntegrationsPage from "./pages/IntegrationsPage";
import PuterFirebaseIntegration from "./components/PuterFirebaseIntegration"; // Import the new component
import AITeamDebugger from "./components/AITeamDebugger";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/ai-employees" element={<ProtectedRoute><AIEmployees /></ProtectedRoute>} />
              <Route path="/ai-employees/:employeeName" element={<AIEmployeePage />} />
              <Route path="/power-ups" element={<ProtectedRoute><PowerUps /></ProtectedRoute>} />
              <Route path="/business-profile" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
              <Route path="/ai-team-workflows" element={<ProtectedRoute><AITeamWorkflows /></ProtectedRoute>} />
              <Route path="/business-intelligence" element={<ProtectedRoute><BusinessIntelligence /></ProtectedRoute>} />
              <Route path="/ai-team-coordination" element={<ProtectedRoute><AITeamCoordination /></ProtectedRoute>} />
              <Route path="/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
              <Route path="/puter-firebase-integration" element={<ProtectedRoute><PuterFirebaseIntegration /></ProtectedRoute>} /> {/* New route added here */}
              <Route path="/dev/debugger" element={<AITeamDebugger />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
