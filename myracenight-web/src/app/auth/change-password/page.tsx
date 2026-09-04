'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button, Input } from '@/components/ui';

// Matches the backend rule in AuthService.changePassword (min 6 characters).
const MIN_PASSWORD_LENGTH = 6;
const PIN_LENGTH = 4;

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, PIN_LENGTH);

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, changePassword } = useAuth();

  const [currentCredential, setCurrentCredential] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [confirmCredential, setConfirmCredential] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isPhoneUser = user?.authMethod === 'PHONE';
  // First login (guest ticket): the backend allows changing without the
  // temporary credential because mustChangePassword is set. A user who
  // navigates here voluntarily must prove their current credential.
  const isFirstLogin = user?.mustChangePassword === true;
  const credentialNoun = isPhoneUser ? 'PIN' : 'password';

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

    if (isPhoneUser) {
      if (newCredential.length !== PIN_LENGTH || !/^\d{4}$/.test(newCredential)) {
        setError(`PIN must be exactly ${PIN_LENGTH} digits.`);
        return;
      }
    } else if (newCredential.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newCredential !== confirmCredential) {
      setError(isPhoneUser ? 'PINs do not match.' : 'Passwords do not match.');
      return;
    }

    if (!isFirstLogin && !currentCredential) {
      setError(`Enter your current ${credentialNoun}.`);
      return;
    }

    try {
      await changePassword(
        isPhoneUser
          ? {
              newPin: newCredential,
              ...(isFirstLogin ? {} : { currentPin: currentCredential }),
            }
          : {
              newPassword: newCredential,
              ...(isFirstLogin ? {} : { currentPassword: currentCredential }),
            }
      );
      redirectByRole();
    } catch (err: any) {
      setError(err.message || `Failed to change ${credentialNoun}. Please try again.`);
    }
  };

  const pinInputProps = {
    inputMode: 'numeric' as const,
    pattern: '\\d{4}',
    maxLength: PIN_LENGTH,
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
          <h1 className="text-3xl font-display font-bold mb-2">
            {isPhoneUser ? 'Set a new PIN' : 'Set a new password'}
          </h1>
          <p className="text-gray-400 mb-8">
            {user?.firstName ? `Welcome, ${user.firstName}. ` : ''}
            {isFirstLogin
              ? `Your ticket came with a temporary ${credentialNoun}, so please choose a new ${credentialNoun} to secure your account before you continue.`
              : `Confirm your current ${credentialNoun} and choose a new one.`}
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isFirstLogin && (
              <Input
                type={showPassword ? 'text' : 'password'}
                label={isPhoneUser ? 'Current PIN' : 'Current password'}
                placeholder={isPhoneUser ? '••••' : '••••••••'}
                value={currentCredential}
                onChange={(e) =>
                  setCurrentCredential(
                    isPhoneUser ? digitsOnly(e.target.value) : e.target.value
                  )
                }
                leftIcon={<Lock className="w-5 h-5 text-gray-500" />}
                required
                {...(isPhoneUser ? pinInputProps : {})}
              />
            )}

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label={isPhoneUser ? 'New PIN' : 'New password'}
                placeholder={isPhoneUser ? '••••' : '••••••••'}
                value={newCredential}
                onChange={(e) =>
                  setNewCredential(isPhoneUser ? digitsOnly(e.target.value) : e.target.value)
                }
                helperText={
                  isPhoneUser
                    ? `Exactly ${PIN_LENGTH} digits.`
                    : `At least ${MIN_PASSWORD_LENGTH} characters.`
                }
                leftIcon={<Lock className="w-5 h-5 text-gray-500" />}
                required
                {...(isPhoneUser ? pinInputProps : { minLength: MIN_PASSWORD_LENGTH })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-300"
                aria-label={showPassword ? `Hide ${credentialNoun}` : `Show ${credentialNoun}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Input
              type={showPassword ? 'text' : 'password'}
              label={isPhoneUser ? 'Confirm new PIN' : 'Confirm new password'}
              placeholder={isPhoneUser ? '••••' : '••••••••'}
              value={confirmCredential}
              onChange={(e) =>
                setConfirmCredential(isPhoneUser ? digitsOnly(e.target.value) : e.target.value)
              }
              leftIcon={<Lock className="w-5 h-5 text-gray-500" />}
              required
              {...(isPhoneUser ? pinInputProps : { minLength: MIN_PASSWORD_LENGTH })}
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
              Secure your account with a new {credentialNoun} and you&apos;re ready to race.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-night to-transparent" />
      </div>
    </div>
  );
}
