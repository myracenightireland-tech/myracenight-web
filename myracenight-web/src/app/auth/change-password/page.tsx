'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button, Input } from '@/components/ui';

// Matches the backend rule in AuthService.changePassword (min 6 characters).
const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, changePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // This page is only reachable once logged in (login redirects here when
  // mustChangePassword is set). If somebody lands here without a session,
  // send them to sign in first.
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  const redirectByRole = () => {
    if (user?.role === 'HOST' || user?.role === 'SUPER_ADMIN') {
      router.push('/dashboard');
    } else {
      router.push('/dashboard/player');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Guest first-login: the backend allows changing without the temporary
      // password because mustChangePassword is set. On success the store
      // clears the flag so we don't get bounced back here.
      await changePassword(newPassword);
      redirectByRole();
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please try again.');
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
          <h1 className="text-3xl font-display font-bold mb-2">Set a new password</h1>
          <p className="text-gray-400 mb-8">
            {user?.firstName ? `Welcome, ${user.firstName}. ` : ''}
            Please choose a new password to secure your account before you continue.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="New password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                helperText={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                leftIcon={<Lock className="w-5 h-5 text-gray-500" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Input
              type={showPassword ? 'text' : 'password'}
              label="Confirm new password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              leftIcon={<Lock className="w-5 h-5 text-gray-500" />}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Save and Continue
            </Button>
          </form>
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
              Almost<br />There
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              Secure your account with a new password and you&apos;re ready to race.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-night to-transparent" />
      </div>
    </div>
  );
}
