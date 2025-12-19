import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/toaster';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, AuthError, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/firebase'; // Import the configured auth instance
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error("Authentication Error", {
        description: error,
      });
      setError(null); // Reset error after showing toast
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      toast.success("Success", {
        description: successMessage,
      });
      setSuccessMessage(null); // Reset success message after showing toast
    }
  }, [successMessage]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || null,
          photoUrl: userCredential.user.photoURL || null,
          is_active: false,
          plan: null,
          role: 'user',
          createdAt: serverTimestamp(),
        });
        
        await sendEmailVerification(userCredential.user);
        setSuccessMessage("We've sent you a verification link. Please verify your email before logging in.");
        setIsSignUp(false); // Switch to sign-in view after successful sign-up
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Ensure fresh auth token before Firestore reads
        await userCredential.user.getIdToken(true);
        
        // Check if user document exists, create if not
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: userCredential.user.email,
            displayName: userCredential.user.displayName || null,
            photoUrl: userCredential.user.photoURL || null,
            is_active: false,
            plan: null,
            role: 'user',
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
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
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(`If an account exists for ${email}, you will receive a password reset link. Please check your inbox.`);
    } catch (err) {
        const error = err as any;
        setError(error.message);
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