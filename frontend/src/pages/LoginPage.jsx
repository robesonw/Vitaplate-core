import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, signup } = useAuth();
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  // Sign-in form state
  const [signInEmail, setSignInEmail]       = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign-up form state
  const [signUpName, setSignUpName]         = useState('');
  const [signUpEmail, setSignUpEmail]       = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpDone, setSignUpDone]         = useState(false);

  const handleGoogle = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // Page will redirect to /Dashboard via Supabase OAuth callback
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await loginWithEmail(signInEmail, signInPassword);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signup(signUpEmail, signUpPassword, signUpName);
      setSignUpDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-white font-semibold">VitaPlate</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/80">Your AI-powered nutrition companion</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6">

            {/* Google OAuth — primary CTA */}
            <Button
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full mb-4 bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 shadow-sm h-11 font-medium"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs text-slate-500 bg-white px-2">
                or continue with email
              </div>
            </div>

            {/* Email tabs */}
            <Tabs defaultValue="signin">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Create Account</TabsTrigger>
              </TabsList>

              {/* Sign In */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={e => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={e => setSignInPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up */}
              <TabsContent value="signup">
                {signUpDone ? (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-3">📧</div>
                    <p className="font-semibold text-slate-800">Check your email</p>
                    <p className="text-sm text-slate-500 mt-1">
                      We sent a confirmation link to <strong>{signUpEmail}</strong>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-3">
                    <div>
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Jane Smith"
                        value={signUpName}
                        onChange={e => setSignUpName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signUpEmail}
                        onChange={e => setSignUpEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Min 6 characters"
                        value={signUpPassword}
                        onChange={e => setSignUpPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

          </CardContent>
        </Card>

        <p className="text-center text-white/60 text-xs mt-6">
          By continuing you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
