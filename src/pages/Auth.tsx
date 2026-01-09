import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Toaster } from '@/components/ui/toaster';
import { toast } from 'sonner';
import { supabase, onAuthStateChanged } from '@/supabase';

// Remember email storage keys
const REMEMBER_EMAIL_KEY = 'auraa_remember_email';
const SAVED_EMAIL_KEY = 'auraa_saved_email';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const navigate = useNavigate();
  const { user, hasBusinessProfile, checkBusinessProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load saved email on mount
  useEffect(() => {
    const shouldRemember = localStorage.getItem(REMEMBER_EMAIL_KEY) === 'true';
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY) || '';
    setRememberEmail(shouldRemember);
    if (shouldRemember && savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        // Check if user has business profile to decide where to redirect
        const hasProfile = await checkBusinessProfile();
        navigate(hasProfile ? '/dashboard' : '/onboarding');
      }
    });
    return () => unsubscribe();
  }, [user, navigate, checkBusinessProfile, hasBusinessProfile]);

  useEffect(() => {
    if (error) {
      toast.error("Authentication Error", {
        description: error,
      });
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      toast.success("Success", {
        description: successMessage,
      });
      setSuccessMessage(null);
    }
  }, [successMessage]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up with Supabase
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Create user profile in public.users table
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              is_active: false,
              role: 'user',
            });

          if (profileError) console.error('Error creating user profile:', profileError);
          
          setSuccessMessage("We've sent you a verification link. Please check your email to verify your account.");
          setIsSignUp(false);
        }
      } else {
        // Save or clear email based on remember preference
        if (rememberEmail) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, 'true');
          localStorage.setItem(SAVED_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
          localStorage.removeItem(SAVED_EMAIL_KEY);
        }
        
        // Sign in with Supabase
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Check if user profile exists, create if not
          const { error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // User doesn't exist, create profile
            await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email,
                is_active: false,
                role: 'user',
              });
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during authentication';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Email is required for password reset.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setSuccessMessage(`If an account exists for ${email}, you will receive a password reset link. Please check your inbox.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/auraa-logo.svg" alt="Auraa Logo" className="w-8 h-8" />
            <span className="text-xl font-bold text-gradient">Auraa</span>
          </div>
          <CardTitle>{isSignUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Sign up to build and deploy your AI workforce.' : 'Sign in to manage your AI employees.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label='Email'
              />
            </div>
            {!isSignUp && (
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-label='Password'
                />
              </div>
            )}
            {!isSignUp && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-email"
                  checked={rememberEmail}
                  onCheckedChange={(checked) => setRememberEmail(checked === true)}
                />
                <label
                  htmlFor="remember-email"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Remember my email
                </label>
              </div>
            )}
            {isSignUp && (
                 <div>
                 <Input
                   type="password"
                   placeholder="Create a password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                   aria-label='Create a password'
                 />
               </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className='text-muted-foreground'
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
            {!isSignUp && (
              <Button
                variant="link"
                onClick={handlePasswordReset}
                disabled={isLoading}
                className='w-full text-xs text-muted-foreground'
              >
                Forgot Password?
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
