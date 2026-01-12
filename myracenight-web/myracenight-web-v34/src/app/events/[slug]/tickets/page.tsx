'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Ticket, CreditCard, User, Mail, Phone,
  CheckCircle, Gift, Sparkles, Lock, AlertCircle, Eye, EyeOff,
  Plus, Trash2, UserPlus, LogIn, Info
} from 'lucide-react';
import { Button, Card, Input, Spinner, Badge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { Event } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  pin: string;
  noEmail: boolean;
  ageVerified: boolean;
}

const emptyGuest: GuestData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  pin: '',
  noEmail: false,
  ageVerified: false,
};

// Progress Step Component
const ProgressSteps = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Your Details', 'Guests (Optional)', 'Confirm'];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            index <= currentStep 
              ? 'bg-gold text-night' 
              : 'bg-night-lighter text-gray-500'
          }`}>
            {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
          </div>
          <span className={`ml-2 text-sm hidden sm:inline ${
            index <= currentStep ? 'text-white' : 'text-gray-500'
          }`}>
            {step}
          </span>
          {index < steps.length - 1 && (
            <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
              index < currentStep ? 'bg-gold' : 'bg-night-lighter'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default function TicketPurchasePage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, isAuthenticated, refreshAuth } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Ticket availability
  const [ticketsSold, setTicketsSold] = useState(0);
  const [ticketsAvailable, setTicketsAvailable] = useState(true);
  
  // Email/Phone availability check
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  
  // Sign in mode toggle
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Primary buyer data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pin: '',
    noEmail: false,
    ageVerified: false,
    agreedToTerms: false,
  });

  // Additional guests
  const [guests, setGuests] = useState<GuestData[]>([]);

  // Load event and check ticket availability
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(`${API_URL}/api/events/by-slug/${slug}`);
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        setEvent(data);
        
        // Check ticket availability - use tickets array length if available
        const soldCount = data.tickets?.length || 0;
        setTicketsSold(soldCount);
        setTicketsAvailable(soldCount < (data.maxAttendees || 100));
        
        // Pre-fill form if authenticated
        if (user) {
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            ageVerified: user.ageVerified || false,
          }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [slug, user]);

  // Check email availability (debounced)
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || email.length < 5 || !email.includes('@')) {
      setEmailCheckStatus('idle');
      return;
    }
    
    setEmailCheckStatus('checking');
    try {
      const response = await fetch(`${API_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setEmailCheckStatus(data.available ? 'available' : 'taken');
    } catch {
      setEmailCheckStatus('idle');
    }
  }, []);

  // Debounce email check
  useEffect(() => {
    if (isAuthenticated || formData.noEmail) return;
    
    const timeout = setTimeout(() => {
      checkEmailAvailability(formData.email);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [formData.email, formData.noEmail, isAuthenticated, checkEmailAvailability]);

  // Check phone availability (debounced)
  const checkPhoneAvailability = useCallback(async (phone: string) => {
    if (!phone || phone.length < 8) {
      setPhoneCheckStatus('idle');
      return;
    }
    
    setPhoneCheckStatus('checking');
    try {
      const response = await fetch(`${API_URL}/api/auth/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      setPhoneCheckStatus(data.available ? 'available' : 'taken');
    } catch {
      setPhoneCheckStatus('idle');
    }
  }, []);

  // Debounce phone check
  useEffect(() => {
    if (isAuthenticated || !formData.noEmail) return;
    
    const timeout = setTimeout(() => {
      checkPhoneAvailability(formData.phone);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [formData.phone, formData.noEmail, isAuthenticated, checkPhoneAvailability]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    setError('');
  };

  const handleGuestChange = (index: number, field: string, value: string | boolean) => {
    setGuests(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addGuest = () => {
    if (!ticketsAvailable) {
      setError('Sorry, this event is sold out');
      return;
    }
    const remaining = (event?.maxAttendees || 100) - ticketsSold - 1 - guests.length;
    if (remaining <= 0) {
      setError(`Only ${(event?.maxAttendees || 100) - ticketsSold} tickets remaining`);
      return;
    }
    setGuests(prev => [...prev, { ...emptyGuest }]);
    setCurrentStep(1);
  };

  const removeGuest = (index: number) => {
    setGuests(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setIsSigningIn(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid email or password');
      }
      
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      // Refresh auth context
      if (refreshAuth) {
        await refreshAuth();
      }
      
      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        email: data.user.email || '',
        phone: data.user.phone || '',
        ageVerified: data.user.ageVerified || false,
      }));
      
      setShowSignIn(false);
    } catch (err: any) {
      setSignInError(err.message || 'Failed to sign in');
    } finally {
      setIsSigningIn(false);
    }
  };

  const validateForm = () => {
    // Check ticket availability
    if (!ticketsAvailable) {
      setError('Sorry, this event is sold out');
      return false;
    }

    // Validate primary buyer
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your first and last name');
      return false;
    }

    if (!formData.ageVerified) {
      setError('You must confirm you are 18 or over');
      return false;
    }

    if (!formData.agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }

    if (!isAuthenticated) {
      // Check if email/phone is already taken
      if (!formData.noEmail && emailCheckStatus === 'taken') {
        setError('This email is already registered. Please sign in instead.');
        setShowSignIn(true);
        return false;
      }
      
      if (formData.noEmail && phoneCheckStatus === 'taken') {
        setError('This phone number is already registered. Please sign in instead.');
        return false;
      }

      if (formData.noEmail) {
        if (!formData.phone) {
          setError('Phone number is required');
          return false;
        }
        if (!formData.pin || formData.pin.length !== 4) {
          setError('Please enter a 4-digit PIN');
          return false;
        }
      } else {
        if (!formData.email) {
          setError('Email is required');
          return false;
        }
        if (!formData.password || formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
      }
    }

    // Validate guests
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      if (!guest.firstName || !guest.lastName) {
        setError(`Guest ${i + 1}: Please enter first and last name`);
        return false;
      }
      if (!guest.ageVerified) {
        setError(`Guest ${i + 1}: Must confirm they are 18 or over`);
        return false;
      }
      if (guest.noEmail) {
        if (!guest.phone) {
          setError(`Guest ${i + 1}: Phone number is required`);
          return false;
        }
        if (!guest.pin || guest.pin.length !== 4) {
          setError(`Guest ${i + 1}: Please enter a 4-digit PIN`);
          return false;
        }
      } else {
        if (!guest.email) {
          setError(`Guest ${i + 1}: Email is required`);
          return false;
        }
        if (!guest.password || guest.password.length < 6) {
          setError(`Guest ${i + 1}: Password must be at least 6 characters`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    setError('');
    if (!validateForm()) {
      return;
    }

    setCurrentStep(2);
    setIsProcessing(true);

    try {
      let token: string | null = localStorage.getItem('accessToken');

      // If not logged in, create account first
      if (!isAuthenticated) {
        const registerData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          ageVerified: formData.ageVerified,
        };

        if (formData.noEmail) {
          registerData.phone = formData.phone;
          registerData.pin = formData.pin;
          registerData.authMethod = 'PHONE';
        } else {
          registerData.email = formData.email;
          registerData.password = formData.password;
          registerData.authMethod = 'EMAIL';
        }

        const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData),
        });

        if (!registerResponse.ok) {
          const errorData = await registerResponse.json();
          throw new Error(errorData.message || 'Failed to create account');
        }

        const registerResult = await registerResponse.json();
        token = registerResult.accessToken;
        
        if (token) {
          localStorage.setItem('accessToken', token);
          if (registerResult.refreshToken) {
            localStorage.setItem('refreshToken', registerResult.refreshToken);
          }
        }
        
        // Refresh auth context
        if (refreshAuth) {
          await refreshAuth();
        }
      }

      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      // Create ticket for primary buyer
      const ticketResponse = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: event.id,
          quantity: 1,
          price: event.ticketPrice,
        }),
      });

      if (!ticketResponse.ok) {
        const errorData = await ticketResponse.json();
        throw new Error(errorData.message || 'Failed to create ticket');
      }

      // Initialize credits for primary buyer
      await fetch(`${API_URL}/api/credits/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: event.id,
          amount: event.ticketPrice * 1000,
        }),
      });

      // Create tickets for guests
      if (guests.length > 0) {
        const guestData = guests.map(guest => ({
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.noEmail ? undefined : guest.email,
          phone: guest.noEmail ? guest.phone : undefined,
          password: guest.noEmail ? undefined : guest.password,
          pin: guest.noEmail ? guest.pin : undefined,
          authMethod: guest.noEmail ? 'PHONE' : 'EMAIL',
          ageVerified: guest.ageVerified,
        }));

        const guestResponse = await fetch(`${API_URL}/api/tickets/purchase-for-guests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            eventId: event.id,
            guests: guestData,
          }),
        });

        if (!guestResponse.ok) {
          const errorData = await guestResponse.json();
          throw new Error(errorData.message || 'Failed to create guest tickets');
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsProcessing(false);
      setCurrentStep(1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Card className="text-center p-8">
          <p className="text-red-400">{error || 'Event not found'}</p>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(event.eventDate);
  const ticketCount = 1 + guests.length;
  const totalPrice = event.ticketPrice * ticketCount;
  const totalCredits = event.ticketPrice * 1000 * ticketCount;
  const ticketsRemaining = (event.maxAttendees || 100) - ticketsSold;

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-night">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="text-center p-8">
            <div className="w-20 h-20 bg-racing-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-racing-green-light" />
            </div>
            <h1 className="text-2xl font-bold mb-2">You're In! 🎉</h1>
            <p className="text-gray-400 mb-6">
              {ticketCount} ticket{ticketCount > 1 ? 's' : ''} confirmed for {event.name}
            </p>
            
            <div className="bg-night-lighter rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-400 mb-1">Your betting credits</p>
              <p className="text-3xl font-bold text-gold">{totalCredits.toLocaleString()}</p>
            </div>

            {guests.length > 0 && (
              <div className="bg-night-lighter rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-400 mb-2">Guest accounts created:</p>
                {guests.map((guest, i) => (
                  <p key={i} className="text-sm">
                    {guest.firstName} {guest.lastName} - 
                    {guest.noEmail ? ` Phone: ${guest.phone}` : ` Email: ${guest.email}`}
                  </p>
                ))}
                <p className="text-xs text-yellow-400 mt-2">
                  Guests will need to change their password/PIN on first login.
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/events/${slug}/horses/submit`}>
                <Button leftIcon={<Sparkles className="w-5 h-5" />}>
                  Create Your Horse
                </Button>
              </Link>
              <Link href={`/events/${slug}/my-dashboard`}>
                <Button variant="secondary">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night">
      {/* Header */}
      <header className="border-b border-night-lighter">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href={`/events/${slug}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <ProgressSteps currentStep={currentStep} />
        
        {/* Sold Out Warning */}
        {!ticketsAvailable && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">This event is sold out</p>
              <p className="text-red-400/70 text-sm">All {event.maxAttendees} tickets have been claimed.</p>
            </div>
          </div>
        )}
        
        {/* Low Tickets Warning */}
        {ticketsAvailable && ticketsRemaining <= 10 && ticketsRemaining > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-400">
              Only <strong>{ticketsRemaining}</strong> ticket{ticketsRemaining !== 1 ? 's' : ''} remaining!
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold mb-2">Get Your Tickets</h1>
            <p className="text-gray-400 mb-8">Join {event.name} at {event.venue}</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sign In Option for Existing Users */}
              {!isAuthenticated && (
                <Card className="bg-night-light border-gold/20">
                  {showSignIn ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold flex items-center gap-2">
                          <LogIn className="w-5 h-5 text-gold" />
                          Sign In
                        </h2>
                        <button
                          type="button"
                          onClick={() => setShowSignIn(false)}
                          className="text-sm text-gray-400 hover:text-white"
                        >
                          Create new account instead
                        </button>
                      </div>
                      
                      {signInError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-red-400 text-sm">{signInError}</p>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <Input
                          type="email"
                          label="Email"
                          placeholder="you@example.com"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          required
                        />
                        <Input
                          type="password"
                          label="Password"
                          placeholder="••••••••"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          onClick={handleSignIn}
                          className="w-full"
                          isLoading={isSigningIn}
                        >
                          Sign In & Continue
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LogIn className="w-5 h-5 text-gold" />
                        <span className="text-gray-300">Already have an account?</span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowSignIn(true)}
                      >
                        Sign In
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {/* Your Details */}
              {!showSignIn && (
                <Card>
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-gold" />
                    Your Details
                  </h2>
                  
                  {isAuthenticated && user ? (
                    <div className="bg-night-lighter rounded-lg p-4">
                      <p className="text-sm text-gray-400">Signed in as</p>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-400">{user.email || user.phone}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          name="firstName"
                          label="First Name *"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                        <Input
                          name="lastName"
                          label="Last Name *"
                          placeholder="Murphy"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-night-lighter rounded-lg">
                        <input
                          type="checkbox"
                          name="noEmail"
                          checked={formData.noEmail}
                          onChange={handleChange}
                          className="w-4 h-4 rounded bg-night border-night-lighter text-gold focus:ring-gold"
                        />
                        <div>
                          <span className="text-gray-300">I don't have an email</span>
                          <p className="text-xs text-gray-500">Use phone number + PIN instead</p>
                        </div>
                      </label>

                      {formData.noEmail ? (
                        <>
                          <div className="relative">
                            <Input
                              type="tel"
                              name="phone"
                              label="Phone Number *"
                              placeholder="+353 87 123 4567"
                              value={formData.phone}
                              onChange={handleChange}
                              required
                              leftIcon={<Phone className="w-4 h-4 text-gray-500" />}
                            />
                            {phoneCheckStatus === 'checking' && (
                              <span className="absolute right-3 top-9 text-gray-400">
                                <Spinner size="sm" />
                              </span>
                            )}
                            {phoneCheckStatus === 'taken' && (
                              <span className="absolute right-3 top-9 text-red-400 text-sm">Already registered</span>
                            )}
                            {phoneCheckStatus === 'available' && (
                              <span className="absolute right-3 top-9 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                          <Input
                            type="password"
                            name="pin"
                            label="Create 4-digit PIN *"
                            placeholder="••••"
                            value={formData.pin}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setFormData(prev => ({ ...prev, pin: value }));
                            }}
                            maxLength={4}
                            required
                            leftIcon={<Lock className="w-4 h-4 text-gray-500" />}
                          />
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <Input
                              type="email"
                              name="email"
                              label="Email *"
                              placeholder="you@example.com"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              leftIcon={<Mail className="w-4 h-4 text-gray-500" />}
                            />
                            {emailCheckStatus === 'checking' && (
                              <span className="absolute right-3 top-9 text-gray-400">
                                <Spinner size="sm" />
                              </span>
                            )}
                            {emailCheckStatus === 'taken' && (
                              <span className="absolute right-3 top-9 text-red-400 text-sm">Already registered</span>
                            )}
                            {emailCheckStatus === 'available' && (
                              <span className="absolute right-3 top-9 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              label="Create Password *"
                              placeholder="Min 6 characters"
                              value={formData.password}
                              onChange={handleChange}
                              required
                              leftIcon={<Lock className="w-4 h-4 text-gray-500" />}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-9 text-gray-500 hover:text-gray-300"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            label="Confirm Password *"
                            placeholder="Re-enter password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            leftIcon={<Lock className="w-4 h-4 text-gray-500" />}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* 18+ Confirmation */}
                  <label className="flex items-center gap-3 mt-4 cursor-pointer p-3 bg-night-lighter rounded-lg">
                    <input
                      type="checkbox"
                      name="ageVerified"
                      checked={formData.ageVerified}
                      onChange={handleChange}
                      className="w-5 h-5 rounded bg-night border-night-lighter text-gold focus:ring-gold"
                      required
                    />
                    <span className="text-white font-medium">I confirm I am 18 years or older *</span>
                  </label>
                  
                  {/* Terms Agreement */}
                  <label className="flex items-start gap-3 mt-3 cursor-pointer p-3 bg-night-lighter rounded-lg">
                    <input
                      type="checkbox"
                      name="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onChange={handleChange}
                      className="w-5 h-5 mt-0.5 rounded bg-night border-night-lighter text-gold focus:ring-gold"
                      required
                    />
                    <span className="text-sm text-gray-400">
                      I agree to the{' '}
                      <Link href="/terms" className="text-gold hover:text-gold-light">Terms of Service</Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-gold hover:text-gold-light">Privacy Policy</Link>
                    </span>
                  </label>
                </Card>
              )}

              {/* Additional Guests */}
              {!showSignIn && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-gold" />
                      Additional Guests
                    </h2>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={addGuest}
                      leftIcon={<Plus className="w-4 h-4" />}
                      disabled={!ticketsAvailable || ticketsRemaining <= 1}
                    >
                      Add Guest
                    </Button>
                  </div>

                  {guests.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      Buying tickets for others? Add their details here and we'll create accounts for them.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {guests.map((guest, index) => (
                        <div key={index} className="p-4 bg-night-lighter rounded-lg relative">
                          <button
                            type="button"
                            onClick={() => removeGuest(index)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <p className="text-sm text-gold mb-3">Guest {index + 1}</p>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                label="First Name *"
                                placeholder="Jane"
                                value={guest.firstName}
                                onChange={(e) => handleGuestChange(index, 'firstName', e.target.value)}
                                required
                              />
                              <Input
                                label="Last Name *"
                                placeholder="Murphy"
                                value={guest.lastName}
                                onChange={(e) => handleGuestChange(index, 'lastName', e.target.value)}
                                required
                              />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={guest.noEmail}
                                onChange={(e) => handleGuestChange(index, 'noEmail', e.target.checked)}
                                className="w-4 h-4 rounded bg-night border-night-lighter text-gold focus:ring-gold"
                              />
                              <span className="text-gray-400 text-sm">Doesn't have email</span>
                            </label>

                            {guest.noEmail ? (
                              <>
                                <Input
                                  type="tel"
                                  label="Phone Number *"
                                  placeholder="+353 87 123 4567"
                                  value={guest.phone}
                                  onChange={(e) => handleGuestChange(index, 'phone', e.target.value)}
                                  required
                                />
                                <Input
                                  type="password"
                                  label="Set their 4-digit PIN *"
                                  placeholder="••••"
                                  value={guest.pin}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    handleGuestChange(index, 'pin', value);
                                  }}
                                  maxLength={4}
                                  required
                                />
                              </>
                            ) : (
                              <>
                                <Input
                                  type="email"
                                  label="Email *"
                                  placeholder="jane@example.com"
                                  value={guest.email}
                                  onChange={(e) => handleGuestChange(index, 'email', e.target.value)}
                                  required
                                />
                                <Input
                                  type="password"
                                  label="Set their temporary password *"
                                  placeholder="Min 6 characters"
                                  value={guest.password}
                                  onChange={(e) => handleGuestChange(index, 'password', e.target.value)}
                                  required
                                />
                              </>
                            )}

                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={guest.ageVerified}
                                onChange={(e) => handleGuestChange(index, 'ageVerified', e.target.checked)}
                                className="w-5 h-5 rounded bg-night border-night-lighter text-gold focus:ring-gold"
                                required
                              />
                              <span className="text-white text-sm font-medium">I confirm this guest is 18 or older *</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Submit Button */}
              {!showSignIn && (
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  isLoading={isProcessing}
                  disabled={!ticketsAvailable}
                  leftIcon={<Lock className="w-5 h-5" />}
                >
                  {isProcessing ? 'Processing...' : `Confirm - €${totalPrice}`}
                </Button>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Event</span>
                  <span className="font-medium text-right">{event.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Date</span>
                  <span>{eventDate.toLocaleDateString('en-IE', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tickets</span>
                  <span>{ticketCount} × €{event.ticketPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Available</span>
                  <span className={ticketsRemaining <= 10 ? 'text-yellow-400' : ''}>
                    {ticketsRemaining} of {event.maxAttendees}
                  </span>
                </div>
              </div>

              <div className="border-t border-night-lighter pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-gold">€{totalPrice}</span>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-racing-green/10 rounded-lg p-4">
                <h3 className="font-medium text-sm mb-3">What's Included (per ticket)</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-racing-green-light" />
                    <span>{(event.ticketPrice * 1000).toLocaleString()} betting credits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-racing-green-light" />
                    <span>Entry to all {event.numberOfRaces} races</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-racing-green-light" />
                    <span>Create your own horse</span>
                  </li>
                  {event.welcomeDrinkIncluded && (
                    <li className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-gold" />
                      <span className="text-gold">Welcome drink</span>
                    </li>
                  )}
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
