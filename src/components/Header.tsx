import { useState } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  ChevronDown, 
  LayoutDashboard, 
  Store, 
  Settings,
  Key,
  FileText,
  Calendar,
  CreditCard,
  User,
  BookOpen,
  Bot,
  Menu
} from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { ThemeToggle } from "./ThemeToggle";
import { OWNER_EMAIL } from "@/config/constants";

export const Header = () => {
  const { user, subscriptionStatus, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOwner = user?.email === OWNER_EMAIL;

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
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
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/blog/admin')} className="cursor-pointer">
                        <Bot className="w-4 h-4 mr-2" />
                        Blog Admin
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  if (location.pathname !== '/') navigate('/');
                  setTimeout(() => document.getElementById('ai-employees')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }} 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                AI Employees
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  if (location.pathname !== '/') navigate('/');
                  setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }} 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Features
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  if (location.pathname !== '/') navigate('/');
                  setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }} 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Button>
              <Button 
                variant={isActive('/blog') ? 'secondary' : 'ghost'} 
                size="sm"
                onClick={() => navigate('/blog')} 
                className="text-sm"
              >
                <BookOpen className="w-4 h-4 mr-1.5" />
                Blog
              </Button>
            </>
          )}
        </div>
        
        <div className="hidden md:flex items-center space-x-2">
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

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle />
          {user && <NotificationCenter />}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg overflow-hidden">
                    <img
                      src="/auraa-uploads/b67b6e27-f714-4f69-87f2-eded4b8eb656.png"
                      alt="Auraa Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-gradient">Auraa</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-3 mt-6">
                {user ? (
                  <>
                    <Button 
                      variant={isActive('/dashboard') ? 'secondary' : 'ghost'} 
                      className="justify-start"
                      onClick={() => handleNavigate('/dashboard')}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button 
                      variant={isActive('/marketplace') ? 'secondary' : 'ghost'} 
                      className="justify-start"
                      onClick={() => handleNavigate('/marketplace')}
                    >
                      <Store className="w-4 h-4 mr-2" />
                      Marketplace
                    </Button>
                    <Button 
                      variant={isActive('/business-profile') ? 'secondary' : 'ghost'} 
                      className="justify-start"
                      onClick={() => handleNavigate('/business-profile')}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Business Profile
                    </Button>
                    <Button 
                      variant={isActive('/api-keys') ? 'secondary' : 'ghost'} 
                      className="justify-start"
                      onClick={() => handleNavigate('/api-keys')}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      API Keys
                    </Button>
                    <Button 
                      variant={isActive('/scheduling') ? 'secondary' : 'ghost'} 
                      className="justify-start"
                      onClick={() => handleNavigate('/scheduling')}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Scheduling
                    </Button>
                    <Button 
                      variant={isActive('/logs') ? 'secondary' : 'ghost'} 
                      className="justify-start"
                      onClick={() => handleNavigate('/logs')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Agent Logs
                    </Button>
                    <Button 
                      variant={isActive('/billing') ? 'secondary' : 'ghost'} 
                      className="justify-start"
                      onClick={() => handleNavigate('/billing')}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing
                    </Button>
                    {isOwner && (
                      <Button 
                        variant={isActive('/blog/admin') ? 'secondary' : 'ghost'} 
                        className="justify-start"
                        onClick={() => handleNavigate('/blog/admin')}
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Blog Admin
                      </Button>
                    )}
                    <div className="border-t pt-3 mt-3">
                      {subscriptionStatus?.subscribed && (
                        <Badge variant="secondary" className="capitalize mb-3">
                          {subscriptionStatus.subscription_tier}
                        </Badge>
                      )}
                      <Button variant="outline" className="w-full" onClick={handleAuthClick}>
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => handleNavigate('/')}
                    >
                      AI Employees
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => handleNavigate('/')}
                    >
                      Features
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => handleNavigate('/')}
                    >
                      Pricing
                    </Button>
                    <Button 
                      variant={isActive('/blog') ? 'secondary' : 'ghost'} 
                      className="justify-start"
                      onClick={() => handleNavigate('/blog')}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Blog
                    </Button>
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <Button variant="outline" className="w-full" onClick={() => handleNavigate('/auth')}>
                        Login
                      </Button>
                      <Button className="w-full" onClick={() => handleNavigate('/auth')}>
                        Get Started
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};
