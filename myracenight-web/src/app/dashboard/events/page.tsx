'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Badge, Button, EmptyState, PageLoading } from '@/components/ui';
import { api } from '@/lib/api';
import { Event, EventStatus } from '@/types';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');

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

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  if (isLoading) return <PageLoading />;

  return (
    <div className="min-h-screen">
      <Header
        title="Events"
        subtitle="Manage your race night events"
      />

      <div className="p-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EventStatus | 'ALL')}
              className="px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="LIVE">Live</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <Link href="/dashboard/events/new">
              <Button leftIcon={<Plus className="w-5 h-5" />}>
                New Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              title="No events found"
              description={searchQuery ? "Try adjusting your search or filters" : "Create your first race night event to get started"}
              action={
                <Link href="/dashboard/events/new">
                  <Button leftIcon={<Plus className="w-5 h-5" />}>
                    Create Event
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} hover padding="none" className="overflow-hidden">
                {/* Event Image */}
                <div className="h-40 bg-gradient-to-br from-racing-green to-racing-green-dark relative overflow-hidden">
                  <div className="absolute inset-0 racing-stripes opacity-30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-50">🏇</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(event.status)}
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-1">{event.name}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{event.tickets?.length || 0} / {event.maxAttendees} attendees</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-night-lighter">
                    <div>
                      <span className="text-2xl font-bold gradient-text">€{event.ticketPrice}</span>
                      <span className="text-gray-500 text-sm"> / ticket</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/events/${event.id}`}>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/events/${event.id}/edit`}>
                        <button className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors">
                          <Edit className="w-5 h-5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
