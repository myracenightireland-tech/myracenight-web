'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Ticket, CreditCard, User, Mail, Phone,
  CheckCircle, Gift, Sparkles, Lock, AlertCircle, Eye, EyeOff,
  Plus, Trash2, UserPlus
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

export default function TicketPurchasePage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
  });

  // Additional guests
  const [guests, setGuests] = useState<GuestData[]>([]);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/events/by-slug/${slug}`
        );
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        setEvent(data);
        
        if (user) {
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName,
            lastName: user.lastName,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleGuestChange = (index: number, field: string, value: string | boolean) => {
    setGuests(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addGuest = () => {
    setGuests(prev => [...prev, { ...emptyGuest }]);
  };

  const removeGuest = (index: number) => {
    setGuests(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    // Validate primary buyer
    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your first and last name');
      return false;
    }

    if (!formData.ageVerified) {
      setError('You must confirm you are 18 or over');
      return false;
    }

    if (!isAuthenticated) {
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
                  Guests must change their password/PIN on first login.
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
              {/* Your Details */}
              <Card>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gold" />
                  Your Details
                </h2>
                
                {isAuthenticated && user ? (
                  <div className="text-gray-400 text-sm">
                    <p>Name: <span className="text-white">{user.firstName} {user.lastName}</span></p>
                    <p>Email: <span className="text-white">{user.email || 'N/A'}</span></p>
                    {user.phone && <p>Phone: <span className="text-white">{user.phone}</span></p>}
                    
                    {!user.ageVerified && (
                      <label className="flex items-center gap-3 mt-4 cursor-pointer">
                        <input
                          type="checkbox"
                          name="ageVerified"
                          checked={formData.ageVerified}
                          onChange={handleChange}
                          className="w-5 h-5 rounded bg-night-lighter border-night-lighter text-gold focus:ring-gold"
                          required
                        />
                        <span className="text-white">I confirm I am 18 years or older</span>
                      </label>
                    )}
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

                    {/* Email or Phone toggle */}
                    <div>
                      <label className="flex items-center gap-3 mb-4 cursor-pointer">
                        <input
                          type="checkbox"
                          name="noEmail"
                          checked={formData.noEmail}
                          onChange={handleChange}
                          className="w-5 h-5 rounded bg-night-lighter border-night-lighter text-gold focus:ring-gold"
                        />
                        <span className="text-gray-400">Doesn't have email</span>
                      </label>

                      {formData.noEmail ? (
                        <>
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
                          <div className="mt-4">
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
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <Input
                            type="email"
                            name="email"
                            label="Email *"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            leftIcon={<Mail className="w-4 h-4 text-gray-500" />}
                          />
                          <div className="mt-4 space-y-4">
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
                          </div>
                        </>
                      )}
                    </div>

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
                  </div>
                )}
              </Card>

              {/* Additional Guests */}
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
                  >
                    Add Guest
                  </Button>
                </div>

                {guests.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Buying tickets for others? Add their details here.
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

              {/* Payment */}
              <Card>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gold" />
                  Payment
                </h2>
                <div className="bg-night-lighter rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm mb-2">
                    Payment integration coming soon!
                  </p>
                  <p className="text-xs text-gray-500">
                    For now, click below to simulate a purchase
                  </p>
                </div>
              </Card>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                isLoading={isProcessing}
                leftIcon={<Lock className="w-5 h-5" />}
              >
                {isProcessing ? 'Processing...' : `Pay €${totalPrice}`}
              </Button>
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
