import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

declare const grecaptcha: any; // Declare grecaptcha to avoid TypeScript errors

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null); // State for displaying errors

  // This function is called by reCAPTCHA upon successful verification.
  // It receives the reCAPTCHA response token.
  const onSubmitRecaptcha = (token: string) => {
    setRecaptchaToken(token);
    // Once we have the token, we can proceed with the actual form submission logic.
    // Since the form submission triggers grecaptcha.execute(), we now have the token
    // and can proceed with the backend verification and Supabase auth.
    handleAuthSubmitWithRecaptcha(token); // Call the main auth handler with the token
  };

  // Render the invisible reCAPTCHA widget
  useEffect(() => {
    if (recaptchaRef.current && typeof grecaptcha !== 'undefined') {
      grecaptcha.render(recaptchaRef.current, {
        'sitekey': '6Leaw-srAAAAAF9BK_yIfPUCzwld-qSXnn63ERV_', // YOUR ACTUAL SITE KEY
        'size': 'invisible',
        'callback': onSubmitRecaptcha,
        'badge': 'bottomright',
      });
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Function to verify reCAPTCHA token on your Supabase Edge Function backend
  const verifyRecaptchaOnBackend = async (token: string) => {
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/verify-recaptcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include Supabase Authorization header if your Edge Function requires it
          // 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ recaptchaToken: token }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Backend reCAPTCHA verification failed:', data.error || 'Unknown error');
        throw new Error(data.error || 'reCAPTCHA verification failed.');
      }
      return true;
    } catch (err) {
      console.error('Error calling reCAPTCHA backend verification:', err);
      throw new Error('Could not verify robot check. Please try again.');
    }
  };

  // This function is called when the form is submitted directly
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Clear previous errors

    // Programmatically execute reCAPTCHA
    if (typeof grecaptcha !== 'undefined') {
      grecaptcha.execute();
    } else {
      // Fallback if reCAPTCHA script hasn't loaded yet (unlikely with async defer)
      console.warn('grecaptcha not loaded, proceeding without reCAPTCHA.');
      setError('reCAPTCHA not loaded. Please refresh and try again.');
      setIsLoading(false);
    }
  };

  // This function contains the actual authentication logic, now dependent on recaptchaToken
  const handleAuthSubmitWithRecaptcha = async (token: string | null) => {
    try {
      if (!token) {
        setError('reCAPTCHA token missing. Please try again.');
        setIsLoading(false);
        return;
      }

      // 1. Verify reCAPTCHA token on your backend
      const isRecaptchaVerified = await verifyRecaptchaOnBackend(token);
      if (!isRecaptchaVerified) {
        throw new Error('reCAPTCHA verification failed.');
      }

      // Reset reCAPTCHA after verification attempt
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
      }
      setRecaptchaToken(null); // Clear the token for the next submission

      // 2. Proceed with Supabase Authentication
      console.log('Starting authentication process...', { isSignUp, email });
      
      if (isSignUp) {
        console.log('Attempting sign up...');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        console.log('Sign up response:', { data, error });
        if (error) throw error;
        toast("Check your email", {
          description: "We've sent you a confirmation link.",
        });
      } else {
        console.log('Attempting sign in...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('Sign in response:', { data, error });
        if (error) throw error;
        console.log('Sign in successful, navigating to dashboard...');
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Authentication error:', err);
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast.error("Authentication Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img
                src="/auraa-uploads/b67b6e27-f714-4f69-87f2-eded4b8eb656.png"
                alt="Auraa Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xl font-bold text-gradient">Auraa-AI Employees</span>
          </div>
          <CardTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Sign up to get started with AI workforce' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4" ref={formRef}>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {/* Invisible reCAPTCHA div - badge will appear here */}
            <div ref={recaptchaRef} className="g-recaptcha" style={{ display: 'none' }}></div>
            {error && <p style={{ color: 'red', fontSize: '0.8rem' }}>{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
