import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  LayoutDashboard, 
  Users, 
  Store, 
  Settings,
  Key,
  FileText,
  Calendar,
  CreditCard,
  User
} from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  const { user, subscriptionStatus, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <nav className="container mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate(user ? '/dashboard' : '/')}>
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img
              src="/auraa-uploads/b67b6e27-f714-4f69-87f2-eded4b8eb656.png"
              alt="Auraa Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xl font-bold text-gradient">Auraa</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-1">
          {user ? (
            <>
              <Button 
                variant={isActive('/dashboard') ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/dashboard')} 
                className="text-sm"
              >
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
              
              <Button 
                variant={isActive('/marketplace') ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/marketplace')} 
                className="text-sm"
              >
                <Store className="w-4 h-4 mr-1.5" />
                Marketplace
              </Button>

              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm">
                    <Settings className="w-4 h-4 mr-1.5" />
                    Settings
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border-border z-[100]">
                  <DropdownMenuItem onClick={() => navigate('/business-profile')} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Business Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/api-keys')} className="cursor-pointer">
                    <Key className="w-4 h-4 mr-2" />
                    API Keys
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/scheduling')} className="cursor-pointer">
                    <Calendar className="w-4 h-4 mr-2" />
                    Scheduling
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/logs')} className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Agent Logs
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/billing')} className="cursor-pointer">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Billing
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <a href="#ai-employees" className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 text-sm">
                AI Employees
              </a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 text-sm">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors px-3 py-2 text-sm">
                Pricing
              </a>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationCenter />
              {subscriptionStatus?.subscribed && (
                <Badge variant="secondary" className="capitalize text-xs">
                  {subscriptionStatus.subscription_tier}
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleAuthClick}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleAuthClick}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
