'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Calendar, MapPin, Clock, Ticket, Trophy, Users, 
  Sparkles, ChevronRight, Gift, CreditCard, Share2
} from 'lucide-react';
import { Button, Badge, Card, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Event } from '@/types';

export default function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvent = async () => {
      try {
        // Fetch event by slug
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app'}/api/events/by-slug/${slug}`
        );
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
  const horseDeadline = new Date(event.horseDeadline);
  const canSubmitHorse = horseDeadline > new Date();

  return (
    <div className="min-h-screen bg-night">
      {/* Header */}
      <header className="bg-night-light border-b border-night-lighter">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏇</span>
            <span className="font-display font-bold text-xl">MyRaceNight</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-racing-green via-night to-night-light py-16">
        <div className="absolute inset-0 bg-racing-stripes opacity-5" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={event.status === 'LIVE' ? 'live' : event.status === 'PUBLISHED' ? 'success' : 'default'}>
              {event.status === 'LIVE' ? '🔴 Live Now' : isUpcoming ? 'Upcoming' : 'Past Event'}
            </Badge>
            {event.club && (
              <Badge variant="default">{event.club.name}</Badge>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {event.name}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-300 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              <span>{eventDate.toLocaleDateString('en-IE', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              <span>{eventDate.toLocaleTimeString('en-IE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold" />
              <span>{event.venue}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            {isUpcoming && event.status !== 'CANCELLED' && (
              <Link href={`/events/${slug}/tickets`}>
                <Button size="lg" leftIcon={<Ticket className="w-5 h-5" />}>
                  Get Tickets - €{event.ticketPrice}
                </Button>
              </Link>
            )}
            {event.status === 'LIVE' && (
              <Link href={`/events/${slug}/live`}>
                <Button size="lg" leftIcon={<Trophy className="w-5 h-5" />}>
                  Watch Live
                </Button>
              </Link>
            )}
            <Button variant="secondary" size="lg" leftIcon={<Share2 className="w-5 h-5" />}>
              Share Event
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            {event.description && (
              <Card>
                <h2 className="text-xl font-bold mb-4">About This Event</h2>
                <p className="text-gray-300 leading-relaxed">{event.description}</p>
              </Card>
            )}

            {/* How It Works */}
            <Card>
              <h2 className="text-xl font-bold mb-6">How Race Night Works</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">1. Get Your Ticket</h3>
                    <p className="text-gray-400 text-sm">
                      Purchase your ticket for €{event.ticketPrice} and receive {event.ticketPrice * 1000} betting credits to use on the night.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">2. Create Your Horse</h3>
                    <p className="text-gray-400 text-sm">
                      Name your horse and give it a hilarious backstory. The funnier, the better - our AI commentator will bring it to life!
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">3. Place Your Bets</h3>
                    <p className="text-gray-400 text-sm">
                      Use your credits to bet on races throughout the night. Back your favourites and watch the odds change!
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">4. Win Prizes!</h3>
                    <p className="text-gray-400 text-sm">
                      The top 3 players with the most credits at the end win prizes! Plus there's always spot prizes throughout the night.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* What's Included */}
            <Card>
              <h2 className="text-xl font-bold mb-4">What's Included</h2>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-racing-green rounded-full flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span>{event.ticketPrice * 1000} betting credits</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-racing-green rounded-full flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span>{event.numberOfRaces} exciting races with AI commentary</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-racing-green rounded-full flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                  <span>Create and name your own horse</span>
                </li>
                {event.welcomeDrinkIncluded && (
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                      <Gift className="w-4 h-4 text-night" />
                    </div>
                    <span className="text-gold font-medium">Welcome drink included!</span>
                  </li>
                )}
              </ul>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Ticket Card */}
            <Card className="border-gold/30">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 mb-1">Ticket Price</p>
                <p className="text-4xl font-bold text-gold">€{event.ticketPrice}</p>
                <p className="text-sm text-gray-400 mt-1">per person</p>
              </div>
              
              {isUpcoming && event.status !== 'CANCELLED' ? (
                <Link href={`/events/${slug}/tickets`} className="block">
                  <Button className="w-full" size="lg">
                    Get Tickets
                  </Button>
                </Link>
              ) : event.status === 'CANCELLED' ? (
                <Button className="w-full" size="lg" disabled>
                  Event Cancelled
                </Button>
              ) : (
                <Button className="w-full" size="lg" disabled>
                  Event Ended
                </Button>
              )}
              
              <p className="text-center text-sm text-gray-500 mt-4">
                <Users className="w-4 h-4 inline mr-1" />
                {event.maxAttendees} spots available
              </p>
            </Card>

            {/* Submit Horse Card */}
            {canSubmitHorse && (
              <Card className="bg-gradient-to-br from-racing-green/20 to-night">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-gold" />
                  <h3 className="font-bold">Already got a ticket?</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Submit your horse before the deadline and give it a hilarious backstory!
                </p>
                <Link href={`/events/${slug}/horses/submit`} className="block">
                  <Button variant="secondary" className="w-full">
                    Submit Your Horse
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Deadline: {horseDeadline.toLocaleDateString('en-IE', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </Card>
            )}

            {/* Event Details */}
            <Card>
              <h3 className="font-bold mb-4">Event Details</h3>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-gray-500">Date & Time</dt>
                  <dd className="font-medium">
                    {eventDate.toLocaleDateString('en-IE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })} at {eventDate.toLocaleTimeString('en-IE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Venue</dt>
                  <dd className="font-medium">{event.venue}</dd>
                  {event.address && (
                    <dd className="text-gray-400 text-xs mt-1">{event.address}</dd>
                  )}
                </div>
                <div>
                  <dt className="text-gray-500">Organised by</dt>
                  <dd className="font-medium">{event.club?.name || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Number of Races</dt>
                  <dd className="font-medium">{event.numberOfRaces} races</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-night-light border-t border-night-lighter py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Powered by <span className="text-gold font-semibold">MyRaceNight</span></p>
          <p className="mt-1">Making fundraising unforgettable 🏇</p>
        </div>
      </footer>
    </div>
  );
}
