'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button, Input, Spinner } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const sessionExpired = searchParams.get('session') === 'expired';
  const { login, isLoading } = useAuth();
  
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const credentials = loginMethod === 'email' 
        ? { email, password }
        : { phone, pin };
      
      const result = await login(credentials);
      
      // Check if user needs to change password
      if (result?.user?.mustChangePassword) {
        router.push('/auth/change-password');
        return;
      }
      
      // If there's a redirect URL, use it
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        // Redirect based on user role
        if (result?.user?.role === 'HOST' || result?.user?.role === 'SUPER_ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/dashboard/player');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-12">
        <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center">
          <span className="text-2xl">🏇</span>
        </div>
        <span className="font-display text-2xl font-bold gradient-text">MyRaceNight</span>
      </Link>

      {/* Header */}
      <h1 className="text-3xl font-display font-bold mb-2">Welcome back</h1>
      <p className="text-gray-400 mb-8">
        {redirectTo ? 'Sign in to access your dashboard' : 'Sign in to your account'}
      </p>

      {/* Login Method Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setLoginMethod('email')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            loginMethod === 'email'
              ? 'bg-gold text-night font-semibold'
              : 'bg-night-lighter text-gray-400 hover:bg-night-light'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('phone')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            loginMethod === 'phone'
              ? 'bg-gold text-night font-semibold'
              : 'bg-night-lighter text-gray-400 hover:bg-night-light'
          }`}
        >
          <Phone className="w-4 h-4" />
          Phone
        </button>
      </div>

      {/* Session expired message */}
      {sessionExpired && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
          <strong>Session expired.</strong> Please sign in again to continue.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {loginMethod === 'email' ? (
          <>
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </>
        ) : (
          <>
            <Input
              type="tel"
              label="Phone number"
              placeholder="+353 87 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              type="password"
              label="4-digit PIN"
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(value);
              }}
              maxLength={4}
              required
            />
          </>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded bg-night-lighter border-night-lighter text-gold focus:ring-gold" />
            <span className="text-sm text-gray-400">Remember me</span>
          </label>
          <Link href="/auth/forgot-password" className="text-sm text-gold hover:text-gold-light">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Sign In
        </Button>
      </form>

      {/* Register link */}
      <p className="mt-8 text-center text-gray-400">
        Don't have an account?{' '}
        <Link href="/auth/register" className="text-gold hover:text-gold-light font-medium">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-night flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <Suspense fallback={<Spinner size="lg" />}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Right side - Image/Pattern */}
      <div className="hidden lg:block flex-1 relative bg-racing-green overflow-hidden">
        <div className="absolute inset-0 racing-stripes opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-racing-green-dark/50 to-transparent" />
        
        <div className="relative h-full flex items-center justify-center p-16">
          <div className="text-center">
            <div className="text-8xl mb-8 animate-gallop inline-block">🏇</div>
            <h2 className="text-4xl font-display font-bold mb-4">
              Your Race Night<br />Awaits
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              Place bets, watch races, and compete on the leaderboard.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-night to-transparent" />
      </div>
    </div>
  );
}
