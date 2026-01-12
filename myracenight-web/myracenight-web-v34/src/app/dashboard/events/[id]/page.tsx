'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, MapPin, Users, Ticket, Trophy, Clock, 
  Play, Pause, CheckCircle, Settings, Share2, QrCode, 
  DollarSign, Edit, Trash2, Rabbit, RefreshCw
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, StatCard, Spinner } from '@/components/ui';
import { TestModeModal } from '@/components/TestModeModal';
import { api } from '@/lib/api';
import { Event, Race, Horse as HorseType, EventStatus, Ticket as TicketType } from '@/types';

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<HorseType[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showTestModeModal, setShowTestModeModal] = useState(false);
  const [commentaryStatus, setCommentaryStatus] = useState<Record<string, any>>({});

  // Function to load all event data
  const loadEventData = async () => {
    try {
      const eventData = await api.getEvent(id);
      setEvent(eventData);
      
      // Load races, horses, and tickets
      try {
        const [racesData, horsesData, ticketsData] = await Promise.all([
          api.getEventRaces(id),
          api.getEventHorses(id),
          api.getEventTickets(id),
        ]);
        setRaces(racesData);
        setHorses(horsesData);
        setTickets(ticketsData);
        
        // Check commentary status for each race
        const statusPromises = racesData.map(async (race: Race) => {
          try {
            const status = await api.getCommentaryStatus(race.id);
            return { raceId: race.id, status };
          } catch (err) {
            return { raceId: race.id, status: { hasCommentary: false } };
          }
        });
        
        const statuses = await Promise.all(statusPromises);
        const statusMap: Record<string, any> = {};
        statuses.forEach(({ raceId, status }) => {
          statusMap[raceId] = status;
        });
        setCommentaryStatus(statusMap);
      } catch (err) {
        // These might not exist yet
        console.log('No races, horses, or tickets yet');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [id]);

  // Refresh data periodically (every 30 seconds) to show new ticket purchases
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isUpdating) {
        loadEventData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [id, isUpdating]);

  const updateEventStatus = async (newStatus: EventStatus) => {
    if (!event) return;
    
    setIsUpdating(true);
    try {
      await api.updateEvent(id, { status: newStatus });
      setEvent({ ...event, status: newStatus });
    } catch (err: any) {
      setError(err.message || 'Failed to update event status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePublish = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app'}/api/events/${id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
      } else {
        setError(data.message || 'Failed to publish event');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish event');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePublishRacecard = async (force: boolean = false) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app'}/api/events/${id}/publish-racecard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force }),
      });
      const data = await response.json();
      
      if (data.requiresConfirmation && !force) {
        // Show confirmation with warnings
        const proceed = confirm(
          `⚠️ Warning: There are issues with some races:\n\n${data.warnings?.join('\n') || ''}\n\nDo you want to proceed anyway?`
        );
        if (proceed) {
          handlePublishRacecard(true);
        }
      } else if (data.success) {
        setEvent(data.event);
        alert('Racecard published! Betting is now open on all races.');
      } else {
        setError(data.message || 'Failed to publish racecard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish racecard');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartEvent = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app'}/api/events/${id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
        router.push(`/dashboard/host`);
      } else {
        setError(data.message || 'Failed to start event');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start event');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEndEvent = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app'}/api/events/${id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
      } else {
        setError(data.message || 'Failed to complete event');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete event');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleShowGoLiveModal = () => setShowTestModeModal(true);
  
  const handleTestMode = async () => {
    setShowTestModeModal(false);
    setIsUpdating(true);
    try {
      await api.startTestMode(id);
      router.push(`/dashboard/host`);
    } catch (err: any) {
      setError(err.message || 'Failed to start test mode');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleGoLive = async () => {
    setShowTestModeModal(false);
    await updateEventStatus('LIVE');
    router.push(`/dashboard/host`);
  };
  
  // Check if all races have commentary
  const hasAllCommentary = races.length > 0 && races.every(race => commentaryStatus[race.id]?.hasCommentary);
  const racesWithoutCommentary = races.filter(race => !commentaryStatus[race.id]?.hasCommentary).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8">
          <p className="text-red-400 mb-4">{error || 'Event not found'}</p>
          <Link href="/dashboard/events">
            <Button>Back to Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="default">Draft</Badge>;
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'RACECARD_PUBLISHED':
        return <Badge variant="warning">Racecard Published</Badge>;
      case 'LIVE':
        return <Badge variant="live">🔴 Live</Badge>;
      case 'COMPLETED':
        return <Badge>Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingHorses = horses.filter(h => h.approvalStatus === 'PENDING').length;
  const approvedHorses = horses.filter(h => h.approvalStatus === 'APPROVED').length;
  
  // Calculate ticket stats
  const ticketsSold = tickets.length;
  const ticketRevenue = tickets.reduce((sum, t) => sum + (t.price || 0), 0);
  const checkedInCount = tickets.filter(t => t.status === 'CHECKED_IN').length;

  return (
    <div className="min-h-screen">
      <Header
        title={event.name}
        subtitle={event.club?.name || 'Event Details'}
      />

      <div className="p-8">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadEventData}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              disabled={isLoading}
            >
              Refresh
            </Button>
            {getStatusBadge(event.status)}
            <Link href={`/dashboard/events/${id}/edit`}>
              <Button variant="ghost" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                Edit
              </Button>
            </Link>
            <Button variant="ghost" size="sm" leftIcon={<Share2 className="w-4 h-4" />}>
              Share
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Tickets Sold"
            value={ticketsSold.toString()}
            subtitle={`of ${event.maxAttendees || 100} available${checkedInCount > 0 ? ` • ${checkedInCount} checked in` : ''}`}
            icon={<Ticket className="w-6 h-6" />}
          />
          <StatCard
            title="Horses Submitted"
            value={horses.length.toString()}
            subtitle={`${pendingHorses} pending • ${approvedHorses} approved`}
            icon={<Rabbit className="w-6 h-6" />}
          />
          <StatCard
            title="Races"
            value={races.length.toString()}
            subtitle={`of ${event.numberOfRaces} planned`}
            icon={<Trophy className="w-6 h-6" />}
          />
          <StatCard
            title="Revenue"
            value={`€${ticketRevenue.toLocaleString()}`}
            subtitle="from ticket sales"
            icon={<DollarSign className="w-6 h-6" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details Card */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Event Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {new Date(event.eventDate).toLocaleDateString('en-IE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(event.eventDate).toLocaleTimeString('en-IE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="font-medium">{event.venue}</p>
                    {event.address && <p className="text-sm text-gray-400">{event.address}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Ticket className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="font-medium">€{event.ticketPrice} per ticket</p>
                    <p className="text-sm text-gray-400">
                      Includes {(event.ticketPrice * 1000).toLocaleString()} betting credits
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="font-medium">Horse Deadline</p>
                    <p className="text-sm text-gray-400">
                      {new Date(event.horseDeadline).toLocaleDateString('en-IE', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Attendees */}
            {tickets.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Attendees</h3>
                  <span className="text-sm text-gray-400">{tickets.length} total</span>
                </div>
                <div className="space-y-2">
                  {tickets.slice(0, 5).map((ticket: any) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-night-lighter rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {ticket.user?.firstName} {ticket.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-400">
                            {ticket.user?.email || ticket.user?.phone || 'No contact'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        ticket.status === 'CHECKED_IN' ? 'success' :
                        ticket.status === 'PAID' ? 'warning' : 'default'
                      }>
                        {ticket.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                {tickets.length > 5 && (
                  <Link href={`/dashboard/events/${id}/attendees`} className="block mt-4">
                    <Button variant="ghost" className="w-full">
                      View All {tickets.length} Attendees
                    </Button>
                  </Link>
                )}
              </Card>
            )}

            {/* Horses Section */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Horses</h3>
                <Link href={`/dashboard/horses?eventId=${id}`}>
                  <Button variant="ghost" size="sm">
                    View All ({horses.length})
                  </Button>
                </Link>
              </div>
              
              {horses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Rabbit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No horses submitted yet</p>
                  <p className="text-sm mt-1">Share the event link so attendees can submit their horses!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {horses.slice(0, 5).map(horse => (
                    <div key={horse.id} className="flex items-center justify-between p-3 bg-night-lighter rounded-lg">
                      <div>
                        <p className="font-medium">{horse.name}</p>
                        <p className="text-sm text-gray-400">by {horse.ownerName}</p>
                      </div>
                      <Badge variant={
                        horse.approvalStatus === 'APPROVED' ? 'success' :
                        horse.approvalStatus === 'REJECTED' ? 'error' : 'warning'
                      }>
                        {horse.approvalStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Races Section */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Races</h3>
                {races.length > 0 && (
                  <Link href={`/dashboard/events/${id}/races`}>
                    <Button variant="ghost" size="sm">
                      Manage Races
                    </Button>
                  </Link>
                )}
              </div>
              
              {races.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No races created yet</p>
                  <p className="text-sm mt-1 mb-4">Generate races for this event</p>
                  <Button 
                    onClick={async () => {
                      setIsUpdating(true);
                      try {
                        const updatedEvent = await api.generateRaces(id);
                        if (updatedEvent.races) {
                          setRaces(updatedEvent.races);
                        }
                      } catch (err: any) {
                        setError(err.message || 'Failed to generate races');
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                    isLoading={isUpdating}
                    leftIcon={<Trophy className="w-4 h-4" />}
                  >
                    Generate Races
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {races.map((race, index) => (
                    <div key={race.id} className="flex items-center justify-between p-3 bg-night-lighter rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-gold/20 text-gold rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">
                            {race.sponsorName ? `${race.sponsorName} ` : ''}{race.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {race.sponsorName ? `Sponsored` : 'No sponsor'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        race.status === 'COMPLETED' ? 'success' :
                        race.status === 'IN_PROGRESS' ? 'live' :
                        race.status === 'BETTING_OPEN' ? 'warning' : 'default'
                      }>
                        {race.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Event Lifecycle</h3>
              <div className="space-y-3">
                {/* Step 1: Publish Event (DRAFT → PUBLISHED) */}
                {event.status === 'DRAFT' && (
                  <Button 
                    className="w-full" 
                    leftIcon={<Play className="w-5 h-5" />}
                    onClick={handlePublish}
                    isLoading={isUpdating}
                  >
                    Publish Event
                  </Button>
                )}
                
                {/* Step 2: Publish Racecard (PUBLISHED → RACECARD_PUBLISHED) */}
                {event.status === 'PUBLISHED' && (
                  <>
                    <div className="text-xs text-gray-400 mb-2 p-2 bg-night-lighter rounded">
                      <p className="font-medium text-gold mb-1">⚠️ Before publishing racecard:</p>
                      <p>• All horses should be submitted</p>
                      <p>• Horses should be assigned to races</p>
                      <p>• Commentary should be generated</p>
                    </div>
                    <Button 
                      className="w-full" 
                      leftIcon={<Trophy className="w-5 h-5" />}
                      onClick={() => handlePublishRacecard(false)}
                      isLoading={isUpdating}
                    >
                      Publish Racecard
                    </Button>
                  </>
                )}
                
                {/* Step 3: Start Event (RACECARD_PUBLISHED → LIVE) */}
                {event.status === 'RACECARD_PUBLISHED' && (
                  <Button 
                    className="w-full" 
                    leftIcon={<Play className="w-5 h-5" />}
                    onClick={handleStartEvent}
                    isLoading={isUpdating}
                  >
                    Start Event
                  </Button>
                )}
                
                {/* Step 4: End Event (LIVE → COMPLETED) */}
                {event.status === 'LIVE' && (
                  <>
                    <Link href="/dashboard/host">
                      <Button 
                        className="w-full mb-2" 
                        leftIcon={<Play className="w-5 h-5" />}
                      >
                        Go to Host Mode
                      </Button>
                    </Link>
                    <Button 
                      className="w-full" 
                      variant="secondary" 
                      leftIcon={<CheckCircle className="w-5 h-5" />}
                      onClick={handleEndEvent}
                      isLoading={isUpdating}
                    >
                      End Event
                    </Button>
                  </>
                )}
                
                {event.status === 'COMPLETED' && (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                    <p className="text-gray-400 mb-4">Event Completed</p>
                    <Link href={`/dashboard/events/${id}/summary`}>
                      <Button className="w-full" leftIcon={<Trophy className="w-5 h-5" />}>
                        View Event Summary
                      </Button>
                    </Link>
                  </div>
                )}
                
                <Button variant="secondary" className="w-full" leftIcon={<QrCode className="w-5 h-5" />}>
                  View QR Code
                </Button>
                <Link href={`/dashboard/events/${id}/edit`}>
                  <Button variant="ghost" className="w-full" leftIcon={<Settings className="w-5 h-5" />}>
                    Event Settings
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Event Link */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Share Event</h3>
              <div className="p-3 bg-night-lighter rounded-lg mb-3">
                <p className="text-xs text-gray-400 mb-1">Event Link</p>
                <a 
                  href={`/events/${event.slug}`}
                  target="_blank"
                  className="text-sm font-mono break-all text-gold hover:underline"
                >
                  /events/{event.slug}
                </a>
              </div>
              <Button 
                variant="secondary" 
                className="w-full" 
                leftIcon={<Share2 className="w-5 h-5" />}
                onClick={() => {
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.slug}`;
                  navigator.clipboard.writeText(url);
                  alert('Link copied!');
                }}
              >
                Copy Link
              </Button>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/20">
              <h3 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h3>
              <Button variant="danger" className="w-full" leftIcon={<Trash2 className="w-5 h-5" />}>
                Cancel Event
              </Button>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Test Mode Modal */}
      <TestModeModal
        isOpen={showTestModeModal}
        onClose={() => setShowTestModeModal(false)}
        onTestMode={handleTestMode}
        onGoLive={handleGoLive}
        eventName={event?.name || ''}
        hasAllCommentary={hasAllCommentary}
        racesWithoutCommentary={racesWithoutCommentary}
      />
    </div>
  );
}
