'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  Users,
  Trophy,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Ticket,
  Flag,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, StatCard, Badge, Button, EmptyState } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Event, EventStatus } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await api.getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, []);

  const stats = {
    totalEvents: events.length,
    liveEvents: events.filter(e => e.status === 'LIVE').length,
    upcomingEvents: events.filter(e => e.status === 'PUBLISHED').length,
    totalTickets: events.reduce((acc, e) => acc + (e.tickets?.length || 0), 0),
  };

  const getStatusBadge = (status: EventStatus) => {
    const variants: Record<EventStatus, 'default' | 'success' | 'warning' | 'error' | 'live'> = {
      DRAFT: 'default',
      PUBLISHED: 'success',
      LIVE: 'live',
      COMPLETED: 'success',
      CANCELLED: 'error',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen">
      <Header
        title={`Welcome back, ${user?.firstName}! 👋`}
        subtitle="Here's what's happening with your race nights"
      />

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={<Calendar className="w-6 h-6" />}
          />
          <StatCard
            title="Live Now"
            value={stats.liveEvents}
            icon={<Flag className="w-6 h-6" />}
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingEvents}
            icon={<Clock className="w-6 h-6" />}
          />
          <StatCard
            title="Tickets Sold"
            value={stats.totalTickets}
            icon={<Ticket className="w-6 h-6" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/events/new">
            <Card hover className="border-dashed border-2 border-night-lighter hover:border-gold/50 bg-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold">Create New Event</h3>
                  <p className="text-sm text-gray-500">Set up your next race night</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/clubs">
            <Card hover className="border-dashed border-2 border-night-lighter hover:border-racing-green-light/50 bg-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-racing-green/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-racing-green-light" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Clubs</h3>
                  <p className="text-sm text-gray-500">View and edit your clubs</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/horses">
            <Card hover className="border-dashed border-2 border-night-lighter hover:border-track-light/50 bg-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-track/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-track-light" />
                </div>
                <div>
                  <h3 className="font-semibold">Review Horses</h3>
                  <p className="text-sm text-gray-500">Approve pending submissions</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card padding="none">
            <div className="p-6 border-b border-night-lighter">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">Your Events</h2>
                <Link href="/dashboard/events" className="text-gold hover:text-gold-light text-sm font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {events.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-8 h-8" />}
                title="No events yet"
                description="Create your first race night event to get started"
                action={
                  <Link href="/dashboard/events/new">
                    <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                      Create Event
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-night-lighter">
                {events.slice(0, 5).map((event) => (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-racing-green/20 rounded-lg flex items-center justify-center text-2xl">
                        🏇
                      </div>
                      <div>
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-sm text-gray-500">
                          {format(new Date(event.eventDate), 'MMM d, yyyy')} • {event.venue}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(event.status)}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Activity Feed */}
          <Card padding="none">
            <div className="p-6 border-b border-night-lighter">
              <h2 className="text-xl font-display font-bold">Recent Activity</h2>
            </div>

            <div className="p-6">
              <EmptyState
                icon={<TrendingUp className="w-8 h-8" />}
                title="No recent activity"
                description="Activity will appear here as people buy tickets and submit horses"
              />
            </div>
          </Card>
        </div>

        {/* Getting Started Guide (show for new users) */}
        {events.length === 0 && (
          <Card className="mt-8 bg-gradient-to-br from-racing-green/20 to-racing-green/5 border-racing-green-light/20">
            <div className="flex items-start gap-6">
              <div className="text-6xl">🏁</div>
              <div className="flex-1">
                <h2 className="text-2xl font-display font-bold mb-2">
                  Ready to host your first race night?
                </h2>
                <p className="text-gray-400 mb-6">
                  Follow these steps to get your fundraiser up and running:
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { step: '1', title: 'Create a Club', desc: 'Set up your GAA, rugby, or soccer club profile' },
                    { step: '2', title: 'Create an Event', desc: 'Set the date, venue, and ticket price' },
                    { step: '3', title: 'Share & Sell', desc: 'Share the link and start selling tickets' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <Link href="/dashboard/clubs/new">
                    <Button rightIcon={<ArrowRight className="w-5 h-5" />}>
                      Let's Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
