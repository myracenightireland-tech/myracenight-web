'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Ticket, CreditCard, User, Mail, Phone,
  CheckCircle, Gift, Sparkles, Lock, AlertCircle
} from 'lucide-react';
import { Button, Card, Input, Spinner, Badge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { Event } from '@/types';

export default function TicketPurchasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app'}/api/events/by-slug/${slug}`
        );
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        setEvent(data);
        
        // Pre-fill form if logged in
        if (user) {
          setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || '',
          });
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    setIsProcessing(true);
    setError('');

    try {
      // In production, this would integrate with Stripe
      // For now, simulate a successful purchase
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
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
  const isUpcoming = eventDate > new Date();
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
            <h1 className="text-3xl font-display font-bold mb-4">You're In! 🎉</h1>
            <p className="text-gray-400 mb-6">
              {ticketCount} ticket{ticketCount > 1 ? 's' : ''} purchased for <span className="text-white font-semibold">{event.name}</span>
            </p>
            
            <div className="bg-night-lighter rounded-xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Confirmation</p>
                  <p className="font-mono font-bold">MRN-{Date.now().toString(36).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Starting Credits</p>
                  <p className="font-bold text-gold">{totalCredits.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-gold" />
                <div className="text-left">
                  <p className="font-semibold">Next Step: Submit Your Horse!</p>
                  <p className="text-sm text-gray-400">Create a horse with a hilarious backstory</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/events/${slug}/horses/submit`}>
                <Button size="lg">Create Your Horse</Button>
              </Link>
              <Link href={`/events/${slug}`}>
                <Button variant="secondary" size="lg">Back to Event</Button>
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              A confirmation email has been sent to {formData.email}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (!isUpcoming || event.status === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {event.status === 'CANCELLED' ? 'Event Cancelled' : 'Event Has Ended'}
          </h2>
          <p className="text-gray-400 mb-6">
            Tickets are no longer available for this event.
          </p>
          <Link href={`/events/${slug}`}>
            <Button variant="secondary">Back to Event</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night">
      {/* Header */}
      <header className="bg-night-light border-b border-night-lighter">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏇</span>
            <span className="font-display font-bold text-xl">MyRaceNight</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Lock className="w-4 h-4" />
            Secure Checkout
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href={`/events/${slug}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to {event.name}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-display font-bold mb-6">Get Your Tickets</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ticket Quantity */}
              <Card>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-gold" />
                  Number of Tickets
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                    className="w-10 h-10 rounded-lg bg-night-lighter hover:bg-night-lighter/80 flex items-center justify-center text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold w-12 text-center">{ticketCount}</span>
                  <button
                    type="button"
                    onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                    className="w-10 h-10 rounded-lg bg-night-lighter hover:bg-night-lighter/80 flex items-center justify-center text-xl font-bold"
                  >
                    +
                  </button>
                  <span className="text-gray-400 ml-2">
                    €{event.ticketPrice} each
                  </span>
                </div>
              </Card>

              {/* Contact Details */}
              <Card>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gold" />
                  Your Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      name="firstName"
                      label="First Name"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      name="lastName"
                      label="Last Name"
                      placeholder="Murphy"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <Input
                    type="email"
                    name="email"
                    label="Email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    leftIcon={<Mail className="w-4 h-4 text-gray-500" />}
                  />
                  <Input
                    type="tel"
                    name="phone"
                    label="Phone (Optional)"
                    placeholder="+353 87 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                    leftIcon={<Phone className="w-4 h-4 text-gray-500" />}
                  />
                </div>
              </Card>

              {/* Payment - Simulated for now */}
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
                <h3 className="font-medium text-sm mb-3">What's Included</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-racing-green-light" />
                    <span>{totalCredits.toLocaleString()} betting credits</span>
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
