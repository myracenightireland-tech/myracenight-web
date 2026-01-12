'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Ticket, CheckCircle, AlertCircle, CreditCard,
  Calendar, MapPin, Clock, User, Sparkles
} from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { Event, Ticket as TicketType } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

export default function PurchaseTicketPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [existingTicket, setExistingTicket] = useState<TicketType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [purchasedTicket, setPurchasedTicket] = useState<TicketType | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push(`/events/${slug}/tickets`);
    }
  }, [isAuthenticated, isLoading, slug, router]);

  // Load event and check for existing ticket
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;
      
      try {
        // Load event
        const eventRes = await fetch(`${API_URL}/api/events/slug/${slug}`);
        if (!eventRes.ok) throw new Error('Event not found');
        const eventData = await eventRes.json();
        setEvent(eventData);

        // Check if user already has a ticket for this event
        const token = localStorage.getItem('accessToken');
        const ticketsRes = await fetch(`${API_URL}/api/tickets/my-tickets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (ticketsRes.ok) {
          const tickets = await ticketsRes.json();
          const existing = tickets.find((t: TicketType) => t.eventId === eventData.id);
          if (existing) {
            setExistingTicket(existing);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [slug, isAuthenticated]);

  const handlePurchase = async () => {
    if (!event || !user) return;
    
    setError('');
    setIsPurchasing(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          price: event.ticketPrice
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to purchase ticket');
      }

      setPurchasedTicket(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to purchase ticket');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-racing-black flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-racing-black flex items-center justify-center">
        <Card className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
          <p className="text-gray-400 mb-4">{error || "This event doesn't exist."}</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Success state - ticket purchased
  if (success && purchasedTicket) {
    return (
      <div className="min-h-screen bg-racing-black">
        <div className="max-w-lg mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Ticket Purchased!</h1>
            <p className="text-gray-400 mb-6">
              You're all set for {event.name}
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Ticket #</span>
                <span className="text-white font-mono">{purchasedTicket.ticketNumber || purchasedTicket.qrCode?.slice(-8)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Starting Credits</span>
                <span className="text-gold font-bold">{purchasedTicket.startingCredits?.toLocaleString()} credits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Amount Paid</span>
                <span className="text-white">€{purchasedTicket.price}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/dashboard/player" className="block">
                <Button className="w-full" size="lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Go to My Dashboard
                </Button>
              </Link>
              <Link href={`/events/${slug}/horses/submit`} className="block">
                <Button variant="outline" className="w-full" size="lg">
                  Submit a Horse
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // User already has ticket
  if (existingTicket) {
    return (
      <div className="min-h-screen bg-racing-black">
        <div className="bg-racing-black/80 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href={`/events/${slug}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              Back to Event
            </Link>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-12">
          <Card className="text-center">
            <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-gold" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You Already Have a Ticket!</h1>
            <p className="text-gray-400 mb-6">
              You've already purchased a ticket for this event.
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Event</span>
                <span className="text-white">{event.name}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Your Credits</span>
                <span className="text-gold font-bold">{existingTicket.startingCredits?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-green-400 capitalize">{existingTicket.status?.toLowerCase()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/dashboard/player" className="block">
                <Button className="w-full" size="lg">
                  Go to My Dashboard
                </Button>
              </Link>
              <Link href={`/events/${slug}/horses/submit`} className="block">
                <Button variant="outline" className="w-full" size="lg">
                  Submit a Horse
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Purchase form
  return (
    <div className="min-h-screen bg-racing-black">
      {/* Header */}
      <div className="bg-racing-black/80 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/events/${slug}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Back to Event
          </Link>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gold" />
            <span className="text-white">{user?.firstName} {user?.lastName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Event Summary Card */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">{event.name}</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-300">
              <Calendar className="w-5 h-5 text-gold" />
              <span>
                {new Date(event.eventDate).toLocaleDateString('en-IE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <MapPin className="w-5 h-5 text-gold" />
              <span>{event.venue || event.venueAddress}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Clock className="w-5 h-5 text-gold" />
              <span>{event.numberOfRaces} Races</span>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Ticket Price</span>
              <span className="text-white text-lg">€{event.ticketPrice}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Starting Credits</span>
              <span className="text-gold font-bold">{(event.ticketPrice * 1000).toLocaleString()} credits</span>
            </div>
            {event.welcomeDrinkIncluded && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Welcome Drink</span>
                <span className="text-green-400">Included ✓</span>
              </div>
            )}
          </div>
        </Card>

        {/* Purchase Card */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Complete Your Purchase</h3>
          
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-gray-400 text-sm">{user?.email || user?.phone}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              One ticket per account. Your details will be shared with the event host.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="border-t border-gray-700 pt-4 mb-4">
            <div className="flex items-center justify-between text-lg">
              <span className="text-white font-semibold">Total</span>
              <span className="text-gold font-bold text-xl">€{event.ticketPrice}</span>
            </div>
          </div>

          <Button 
            onClick={handlePurchase}
            className="w-full" 
            size="lg"
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <Spinner size="sm" />
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Purchase Ticket - €{event.ticketPrice}
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Payment will be collected at the event. This reserves your spot.
          </p>
        </Card>
      </div>
    </div>
  );
}
