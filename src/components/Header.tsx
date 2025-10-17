import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Users, Zap, BarChart3, Settings, Bot, Workflow, Brain, Network, TrendingUp } from "lucide-react";

export const Header = () => {
  const { user, subscriptionStatus, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate(user ? '/dashboard' : '/')}>
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img
              src="/auraa-uploads/b67b6e27-f714-4f69-87f2-eded4b8eb656.png"
              alt="Auraa Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-bold text-gradient">Auraa-AI Employees</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-2">
          {user ? (
            <>
              {/* AI Team Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Bot className="w-4 h-4 mr-2" />
                    AI Team
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background border-border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => navigate('/ai-employees')} className="cursor-pointer">
                    <Users className="w-4 h-4 mr-2" />
                    AI Employees
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/ai-team-workflows')} className="cursor-pointer">
                    <Workflow className="w-4 h-4 mr-2" />
                    Team Workflows
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/ai-team-coordination')} className="cursor-pointer">
                    <Network className="w-4 h-4 mr-2" />
                    Team Coordination
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Analytics & Intelligence Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background border-border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => navigate('/analytics')} className="cursor-pointer">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Performance Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/business-intelligence')} className="cursor-pointer">
                    <Brain className="w-4 h-4 mr-2" />
                    Business Intelligence
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <Zap className="w-4 h-4 mr-2" />
                    Tools
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background border-border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => navigate('/power-ups')} className="cursor-pointer">
                    <Zap className="w-4 h-4 mr-2" />
                    PowerUps
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/business-profile')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Business Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <a href="#ai-employees" className="text-muted-foreground hover:text-foreground transition-colors">
                AI Employees
              </a>
              <a href="#analytics" className="text-muted-foreground hover:text-foreground transition-colors">
                Analytics
              </a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {subscriptionStatus?.subscribed && (
                <Badge variant="secondary" className="capitalize">
                  {subscriptionStatus.subscription_tier} Plan
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="ghost" onClick={handleAuthClick}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleAuthClick}>
                Login
              </Button>
              <Button variant="hero" onClick={() => navigate('/auth')}>
                Try For Free
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};