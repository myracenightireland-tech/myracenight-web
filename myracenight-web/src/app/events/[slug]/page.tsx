'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, MapPin, Clock, Ticket, Trophy, Users, 
  Sparkles, ChevronRight, Gift, CreditCard, Share2
} from 'lucide-react';
import { Button, Badge, Card, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Event } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasTicket, setHasTicket] = useState(false);
  const [checkingTicket, setCheckingTicket] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        // Fetch event by slug
        const response = await fetch(`${API_URL}/api/events/by-slug/${slug}`);
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [slug]);

  // Check if user has a ticket for THIS event
  useEffect(() => {
    const checkTicketStatus = async () => {
      if (!isAuthenticated || !event) {
        setHasTicket(false);
        return;
      }
      
      setCheckingTicket(true);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setHasTicket(false);
          return;
        }
        
        // Check if user has a ticket for this specific event
        const response = await fetch(`${API_URL}/api/tickets/my-tickets`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const tickets = await response.json();
          // Check if any ticket matches this event
          const hasTicketForEvent = tickets.some((ticket: any) => 
            ticket.eventId === event.id || ticket.event?.id === event.id
          );
          setHasTicket(hasTicketForEvent);
        } else {
          setHasTicket(false);
        }
      } catch (err) {
        console.error('Failed to check ticket status:', err);
        setHasTicket(false);
      } finally {
        setCheckingTicket(false);
      }
    };
    
    checkTicketStatus();
  }, [isAuthenticated, event]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <Trophy className="w-16 h-16 text-gold mx-auto mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-gray-400 mb-6">This event may have ended or the link is incorrect.</p>
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(event.eventDate);
  const isUpcoming = eventDate > new Date();
  const isPast = event.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-night">
      {/* Header */}
      <header className="bg-night-light border-b border-night-lighter">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏇</span>
            <span className="font-display font-bold text-xl">MyRaceNight</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-night-light to-night border-b border-night-lighter">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
          {/* Event Status Badges */}
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            {isPast && <Badge variant="default">Past Event</Badge>}
            {event.status === 'LIVE' && <Badge variant="live">🔴 Live Now</Badge>}
            {event.club && <Badge variant="default">{event.club.name}</Badge>}
          </div>

          {/* Event Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-3 sm:mb-4">
            {event.name}
          </h1>

          {/* Event Meta */}
          <div className="flex flex-wrap gap-3 sm:gap-6 text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
              <span>{eventDate.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
              <span>{eventDate.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
              <span>{event.venue}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {checkingTicket ? (
              <Button size="lg" className="w-full sm:w-auto" disabled>
                <span className="mr-2"><Spinner size="sm" /></span>
                Checking...
              </Button>
            ) : hasTicket ? (
              /* User HAS a ticket for this event - go to player dashboard */
              <Link href={`/dashboard/player/events/${event.id}`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto" leftIcon={<Trophy className="w-5 h-5" />}>
                  Go to My Dashboard
                </Button>
              </Link>
            ) : (
              /* User does NOT have a ticket - show Get Tickets button */
              <>
                {event.status !== 'CANCELLED' && event.status !== 'COMPLETED' && (
                  <Link href={`/events/${slug}/tickets`} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto" leftIcon={<Ticket className="w-5 h-5" />}>
                      Get Tickets - €{event.ticketPrice}
                    </Button>
                  </Link>
                )}
                {!isAuthenticated && (
                  <Link href={`/auth/login?redirect=/events/${slug}`} className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                      Already have a ticket? Sign In
                    </Button>
                  </Link>
                )}
              </>
            )}
            <Button variant="ghost" size="lg" className="w-full sm:w-auto" leftIcon={<Share2 className="w-5 h-5" />}>
              Share Event
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            {/* About Section */}
            {event.description && (
              <Card>
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">About This Event</h2>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{event.description}</p>
              </Card>
            )}

            {/* How It Works */}
            <Card>
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">How Race Night Works</h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">1. Get Your Ticket</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Purchase your ticket for €{event.ticketPrice} and receive {(event.ticketPrice * 1000).toLocaleString()} betting credits.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">2. Create Your Horse</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Name your horse and give it a hilarious backstory. Our AI commentator will bring it to life!
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">3. Place Your Bets</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Use your credits to bet on races throughout the night. Back your favourites!
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">4. Win Prizes!</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Top 3 players with the most credits win prizes! Plus spot prizes throughout.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* What's Included */}
            <Card>
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">What's Included</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ChevronRight className="w-5 h-5 text-gold" />
                  <span className="text-sm sm:text-base">{(event.ticketPrice * 1000).toLocaleString()} betting credits</span>
                </div>
                <div className="flex items-center gap-3">
                  <ChevronRight className="w-5 h-5 text-gold" />
                  <span className="text-sm sm:text-base">{event.numberOfRaces} exciting races with AI commentary</span>
                </div>
                <div className="flex items-center gap-3">
                  <ChevronRight className="w-5 h-5 text-gold" />
                  <span className="text-sm sm:text-base">Create and name your own horse</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Event Details */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Event Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Date & Time</p>
                  <p className="font-medium">
                    {eventDate.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })} at {eventDate.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Venue</p>
                  <p className="font-medium">{event.venue}</p>
                  {event.venueAddress && (
                    <p className="text-gray-400 text-sm">{event.venueAddress}</p>
                  )}
                </div>
                {event.club && (
                  <div>
                    <p className="text-gray-400 text-sm">Organised by</p>
                    <p className="font-medium">{event.club.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 text-sm">Number of Races</p>
                  <p className="font-medium">{event.numberOfRaces} races</p>
                </div>
              </div>
            </Card>

            {/* CTA Card for Mobile */}
            {!hasTicket && isUpcoming && event.status !== 'CANCELLED' && (
              <Card className="bg-gradient-to-br from-gold/20 to-gold/5 border-gold/30">
                <div className="text-center">
                  <Gift className="w-12 h-12 text-gold mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Ready to Join?</h3>
                  <p className="text-gray-300 mb-4 text-sm">
                    Get your ticket and start the fun!
                  </p>
                  <Link href={`/events/${slug}/tickets`} className="block">
                    <Button className="w-full" size="lg">
                      Get Tickets - €{event.ticketPrice}
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
