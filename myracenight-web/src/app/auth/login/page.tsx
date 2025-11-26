'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-night flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
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
          <p className="text-gray-400 mb-8">Sign in to manage your race nights</p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
      </div>

      {/* Right side - Image/Pattern */}
      <div className="hidden lg:block flex-1 relative bg-racing-green overflow-hidden">
        <div className="absolute inset-0 racing-stripes opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-racing-green-dark/50 to-transparent" />
        
        <div className="relative h-full flex items-center justify-center p-16">
          <div className="text-center">
            <div className="text-8xl mb-8 animate-gallop inline-block">🏇</div>
            <h2 className="text-4xl font-display font-bold mb-4">
              Host Amazing<br />Race Nights
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              AI commentary, live betting, and unforgettable moments for your club.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-night to-transparent" />
      </div>
    </div>
  );
}
