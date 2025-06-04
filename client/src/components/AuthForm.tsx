
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { AuthResponse, SignUpInput, SignInInput } from '../../../server/src/schema';

type AuthUser = AuthResponse['user'];

interface AuthFormProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signUpData, setSignUpData] = useState<SignUpInput>({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });

  const [signInData, setSignInData] = useState<SignInInput>({
    email: '',
    password: ''
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await trpc.signUp.mutate(signUpData);
      onAuthSuccess(response.user);
    } catch (error) {
      console.error('Sign up failed:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await trpc.signIn.mutate(signInData);
      onAuthSuccess(response.user);
    } catch (error) {
      console.error('Sign in failed:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-orange-200 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-orange-600">Welcome!</CardTitle>
        <CardDescription>
          Sign in to your account or create a new one to start shopping
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-orange-50">
            <TabsTrigger value="signin" className="data-[state=active]:bg-orange-100">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-orange-100">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={signInData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSignInData((prev: SignInInput) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter your email"
                  className="border-orange-200 focus:border-orange-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={signInData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSignInData((prev: SignInInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Enter your password"
                  className="border-orange-200 focus:border-orange-300"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading ? 'Signing in...' : 'Sign In 🚀'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstname">First Name</Label>
                  <Input
                    id="signup-firstname"
                    value={signUpData.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSignUpData((prev: SignUpInput) => ({ ...prev, first_name: e.target.value }))
                    }
                    placeholder="First name"
                    className="border-orange-200 focus:border-orange-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastname">Last Name</Label>
                  <Input
                    id="signup-lastname"
                    value={signUpData.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSignUpData((prev: SignUpInput) => ({ ...prev, last_name: e.target.value }))
                    }
                    placeholder="Last name"
                    className="border-orange-200 focus:border-orange-300"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signUpData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSignUpData((prev: SignUpInput) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter your email"
                  className="border-orange-200 focus:border-orange-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signUpData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSignUpData((prev: SignUpInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Create a password (min 6 characters)"
                  className="border-orange-200 focus:border-orange-300"
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isLoading ? 'Creating account...' : 'Create Account ✨'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
