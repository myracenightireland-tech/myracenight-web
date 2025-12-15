'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, MapPin, Users, Ticket, Trophy, Clock, 
  Play, Pause, CheckCircle, Settings, Share2, QrCode, 
  DollarSign, Edit, Trash2, Rabbit
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, StatCard, Spinner } from '@/components/ui';
import { TestModeModal } from '@/components/TestModeModal';
import { api } from '@/lib/api';
import { Event, Race, Horse as HorseType, EventStatus } from '@/types';

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<HorseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showTestModeModal, setShowTestModeModal] = useState(false);
  const [commentaryStatus, setCommentaryStatus] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const eventData = await api.getEvent(id);
        setEvent(eventData);
        
        // Load races and horses
        try {
          const [racesData, horsesData] = await Promise.all([
            api.getEventRaces(id),
            api.getEventHorses(id)
          ]);
          setRaces(racesData);
          setHorses(horsesData);
          
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
          console.log('No races or horses yet');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [id]);

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

  const handlePublish = () => updateEventStatus('PUBLISHED');
  const handleShowGoLiveModal = () => setShowTestModeModal(true);
  const handleEndEvent = () => updateEventStatus('COMPLETED');
  
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
            value="0"
            subtitle={`of ${event.maxAttendees || 100} available`}
            icon={<Ticket className="w-6 h-6" />}
          />
          <StatCard
            title="Horses Submitted"
            value={horses.length.toString()}
            subtitle={`${pendingHorses} pending approval`}
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
            value="€0"
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
                      Includes {event.ticketPrice * 1000} betting credits
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
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
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
                {event.status === 'PUBLISHED' && (
                  <Button 
                    className="w-full" 
                    leftIcon={<Play className="w-5 h-5" />}
                    onClick={handleShowGoLiveModal}
                    isLoading={isUpdating}
                  >
                    Go Live
                  </Button>
                )}
                {event.status === 'LIVE' && (
                  <Button 
                    className="w-full" 
                    variant="secondary" 
                    leftIcon={<CheckCircle className="w-5 h-5" />}
                    onClick={handleEndEvent}
                    isLoading={isUpdating}
                  >
                    End Event
                  </Button>
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
