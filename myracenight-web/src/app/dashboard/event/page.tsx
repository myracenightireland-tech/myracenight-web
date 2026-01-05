'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar, MapPin, Ticket, Users, Flag, Clock, Globe, 
  Save, AlertCircle, CheckCircle, ExternalLink, Copy, Play
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Badge, Spinner, Input } from '@/components/ui';
import { TestModeModal } from '@/components/TestModeModal';
import { api } from '@/lib/api';
import { useCurrentEvent } from '@/lib/eventContext';
import { EventStatus } from '@/types';

export default function EventDetailsPage() {
  const router = useRouter();
  const { currentEvent, isLoading, refreshEvent, setCurrentEvent } = useCurrentEvent();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTestModeModal, setShowTestModeModal] = useState(false);
  const [races, setRaces] = useState<any[]>([]);
  const [commentaryStatus, setCommentaryStatus] = useState<Record<string, any>>({});

  const [form, setForm] = useState({
    name: '',
    description: '',
    eventDate: '',
    venue: '',
    venueAddress: '',
    ticketPrice: '',
    maxAttendees: '',
    numberOfRaces: '',
    horsesPerRace: '',
    maxHorsesPerPerson: '',
    horseDeadline: '',
    contentFilterMode: 'CLEAN',
    welcomeDrinkIncluded: false,
  });

  useEffect(() => {
    if (currentEvent) {
      setForm({
        name: currentEvent.name || '',
        description: currentEvent.description || '',
        eventDate: currentEvent.eventDate ? new Date(currentEvent.eventDate).toISOString().slice(0, 16) : '',
        venue: currentEvent.venue || '',
        venueAddress: currentEvent.venueAddress || '',
        ticketPrice: currentEvent.ticketPrice?.toString() || '',
        maxAttendees: currentEvent.maxAttendees?.toString() || '',
        numberOfRaces: currentEvent.numberOfRaces?.toString() || '',
        horsesPerRace: currentEvent.horsesPerRace?.toString() || '',
        maxHorsesPerPerson: currentEvent.maxHorsesPerPerson?.toString() || '',
        horseDeadline: currentEvent.horseDeadline ? new Date(currentEvent.horseDeadline).toISOString().slice(0, 16) : '',
        contentFilterMode: currentEvent.contentFilterMode || 'CLEAN',
        welcomeDrinkIncluded: currentEvent.welcomeDrinkIncluded || false,
      });
    } else {
      // Set smart defaults for new events
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      oneMonthFromNow.setHours(19, 0, 0, 0); // Default to 7 PM
      
      const oneWeekBefore = new Date(oneMonthFromNow);
      oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
      
      setForm(prev => ({
        ...prev,
        eventDate: prev.eventDate || oneMonthFromNow.toISOString().slice(0, 16),
        horseDeadline: prev.horseDeadline || oneWeekBefore.toISOString().slice(0, 16),
      }));
    }
  }, [currentEvent]);

  // Load races and commentary status
  useEffect(() => {
    const loadRacesAndCommentary = async () => {
      if (!currentEvent?.id) return;
      try {
        const racesData = await api.getEventRaces(currentEvent.id);
        setRaces(racesData);
        
        // Check commentary status for each race
        const statusPromises = racesData.map(async (race: any) => {
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
        console.log('Could not load races');
      }
    };
    
    loadRacesAndCommentary();
  }, [currentEvent?.id]);

  const handleSave = async () => {
    if (!currentEvent) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validate dates
      const eventDate = new Date(form.eventDate);
      const now = new Date();
      
      if (eventDate < now) {
        setError('Event date cannot be in the past');
        setSaving(false);
        return;
      }
      
      if (form.horseDeadline) {
        const deadline = new Date(form.horseDeadline);
        if (deadline < now) {
          setError('Horse submission deadline cannot be in the past');
          setSaving(false);
          return;
        }
        if (deadline > eventDate) {
          setError('Horse submission deadline must be before the event date');
          setSaving(false);
          return;
        }
      }
      
      const updated = await api.updateEvent(currentEvent.id, {
        name: form.name,
        description: form.description,
        eventDate: new Date(form.eventDate).toISOString(),
        venue: form.venue,
        venueAddress: form.venueAddress,
        ticketPrice: parseFloat(form.ticketPrice),
        maxAttendees: parseInt(form.maxAttendees),
        numberOfRaces: parseInt(form.numberOfRaces),
        horsesPerRace: parseInt(form.horsesPerRace),
        maxHorsesPerPerson: parseInt(form.maxHorsesPerPerson),
        horseDeadline: form.horseDeadline ? new Date(form.horseDeadline).toISOString() : undefined,
        contentFilterMode: form.contentFilterMode,
        welcomeDrinkIncluded: form.welcomeDrinkIncluded,
      });
      setCurrentEvent(updated);
      setSuccess('Event saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentEvent) return;
    setPublishing(true);
    setError('');

    try {
      const updated = await api.updateEvent(currentEvent.id, { status: 'PUBLISHED' as EventStatus });
      setCurrentEvent(updated);
      setSuccess('Event published! Share the link with your community.');
    } catch (err: any) {
      setError(err.message || 'Failed to publish event');
    } finally {
      setPublishing(false);
    }
  };

  const handleShowGoLiveModal = () => {
    setShowTestModeModal(true);
  };

  const handleTestMode = async () => {
    if (!currentEvent) return;
    setShowTestModeModal(false);
    setPublishing(true);
    try {
      await api.startTestMode(currentEvent.id);
      router.push('/dashboard/host');
    } catch (err: any) {
      setError(err.message || 'Failed to start test mode');
    } finally {
      setPublishing(false);
    }
  };

  const handleGoLive = async () => {
    if (!currentEvent) return;
    setShowTestModeModal(false);
    setPublishing(true);
    setError('');

    try {
      const updated = await api.updateEvent(currentEvent.id, { status: 'LIVE' as EventStatus });
      setCurrentEvent(updated);
      router.push('/dashboard/host');
    } catch (err: any) {
      setError(err.message || 'Failed to go live');
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = () => {
    if (currentEvent) {
      navigator.clipboard.writeText(`${window.location.origin}/events/${currentEvent.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen">
        <Header title="Event Details" subtitle="Manage your event" />
        <div className="p-8">
          <Card className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No event yet</h2>
            <p className="text-gray-400 mb-6">Create your first event to get started</p>
            <Link href="/dashboard/events/new">
              <Button>Create Event</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (currentEvent.status) {
      case 'DRAFT':
        return <Badge variant="default">Draft</Badge>;
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'LIVE':
        return <Badge variant="live">🔴 Live</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="default">{currentEvent.status}</Badge>;
    }
  };

  const isEditable = currentEvent.status === 'DRAFT' || currentEvent.status === 'PUBLISHED';
  
  // Check if all races have commentary
  const hasAllCommentary = races.length > 0 && races.every(race => commentaryStatus[race.id]?.hasCommentary);
  const racesWithoutCommentary = races.filter(race => !commentaryStatus[race.id]?.hasCommentary).length;

  return (
    <div className="min-h-screen">
      <Header
        title="Event Details"
        subtitle={currentEvent.name}
      />

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-400">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Basic Information</h2>
                {getStatusBadge()}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={!isEditable}
                    className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                    placeholder="e.g., St. Patrick's Race Night 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    disabled={!isEditable}
                    rows={3}
                    className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50 resize-none"
                    placeholder="Tell people about your event..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Event Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={form.eventDate}
                      onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                      disabled={!isEditable}
                      className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Horse Submission Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={form.horseDeadline}
                      onChange={(e) => setForm({ ...form, horseDeadline: e.target.value })}
                      disabled={!isEditable}
                      className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Venue Name
                    </label>
                    <input
                      type="text"
                      value={form.venue}
                      onChange={(e) => setForm({ ...form, venue: e.target.value })}
                      disabled={!isEditable}
                      className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                      placeholder="e.g., The Local GAA Club"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Venue Address
                    </label>
                    <input
                      type="text"
                      value={form.venueAddress}
                      onChange={(e) => setForm({ ...form, venueAddress: e.target.value })}
                      disabled={!isEditable}
                      className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                      placeholder="123 Main Street, Dublin"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-6">Tickets & Capacity</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ticket Price (€)
                  </label>
                  <input
                    type="number"
                    value={form.ticketPrice}
                    onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })}
                    disabled={!isEditable}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum Attendees
                  </label>
                  <input
                    type="number"
                    value={form.maxAttendees}
                    onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                    disabled={!isEditable}
                    min="1"
                    className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-6">Races & Horses</h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Races
                  </label>
                  <input
                    type="number"
                    value={form.numberOfRaces}
                    onChange={(e) => setForm({ ...form, numberOfRaces: e.target.value })}
                    disabled={currentEvent.status !== 'DRAFT'}
                    min="1"
                    max="12"
                    className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                  />
                  {currentEvent.status !== 'DRAFT' && (
                    <p className="text-xs text-gray-500 mt-1">Cannot change after races are created</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Horses per Race
                  </label>
                  <input
                    type="number"
                    value={form.horsesPerRace}
                    onChange={(e) => setForm({ ...form, horsesPerRace: e.target.value })}
                    disabled={currentEvent.status !== 'DRAFT'}
                    min="4"
                    max="12"
                    className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Horses per Person
                  </label>
                  <input
                    type="number"
                    value={form.maxHorsesPerPerson}
                    onChange={(e) => setForm({ ...form, maxHorsesPerPerson: e.target.value })}
                    disabled={!isEditable}
                    min="1"
                    max="5"
                    className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-6">Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content Filter
                  </label>
                  <select
                    value={form.contentFilterMode}
                    onChange={(e) => setForm({ ...form, contentFilterMode: e.target.value })}
                    disabled={!isEditable}
                    className="w-full px-4 py-3 bg-night-light border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold disabled:opacity-50"
                  >
                    <option value="CLEAN">Clean - Family friendly</option>
                    <option value="MODERATE">Moderate - Light humor allowed</option>
                    <option value="ADULT">Adult - No restrictions</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.welcomeDrinkIncluded}
                    onChange={(e) => setForm({ ...form, welcomeDrinkIncluded: e.target.checked })}
                    disabled={!isEditable}
                    className="w-5 h-5 rounded border-night-lighter bg-night-light text-gold focus:ring-gold"
                  />
                  <span className="text-gray-300">Welcome drink included with ticket</span>
                </label>
              </div>
            </Card>

            {isEditable && (
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSave}
                  isLoading={saving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Current Status</span>
                  {getStatusBadge()}
                </div>

                {currentEvent.status === 'DRAFT' && (
                  <Button
                    className="w-full"
                    onClick={handlePublish}
                    isLoading={publishing}
                    leftIcon={<Globe className="w-5 h-5" />}
                  >
                    Publish Event
                  </Button>
                )}

                {currentEvent.status === 'PUBLISHED' && (
                  <Button
                    className="w-full"
                    onClick={handleShowGoLiveModal}
                    isLoading={publishing}
                    leftIcon={<Play className="w-5 h-5" />}
                  >
                    Go Live
                  </Button>
                )}
              </div>
            </Card>

            {/* Event Link */}
            {currentEvent.status !== 'DRAFT' && (
              <Card>
                <h3 className="text-lg font-semibold mb-4">Share Event</h3>
                
                <div className="p-3 bg-night-lighter rounded-lg mb-3">
                  <p className="text-xs text-gray-400 mb-1">Public Link</p>
                  <p className="text-sm font-mono text-gold break-all">
                    /events/{currentEvent.slug}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={copyLink}
                    leftIcon={copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Link href={`/events/${currentEvent.slug}`} target="_blank">
                    <Button variant="ghost" leftIcon={<ExternalLink className="w-4 h-4" />}>
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Ticket className="w-4 h-4" /> Tickets
                  </span>
                  <span className="font-semibold">
                    {currentEvent.tickets?.length || 0} / {currentEvent.maxAttendees}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Flag className="w-4 h-4" /> Races
                  </span>
                  <span className="font-semibold">
                    {currentEvent.races?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Horses
                  </span>
                  <span className="font-semibold">
                    {currentEvent.horses?.length || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            {currentEvent.status === 'DRAFT' && (
              <Card className="bg-gold/5 border-gold/20">
                <h3 className="text-lg font-semibold mb-4 text-gold">Next Steps</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center text-gold font-bold flex-shrink-0">1</span>
                    <span className="text-gray-300">Configure races and add sponsors</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center text-gold font-bold flex-shrink-0">2</span>
                    <span className="text-gray-300">Review and finalize event details</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center text-gold font-bold flex-shrink-0">3</span>
                    <span className="text-gray-300">Publish and share with your community</span>
                  </li>
                </ol>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Test Mode Modal */}
      <TestModeModal
        isOpen={showTestModeModal}
        onClose={() => setShowTestModeModal(false)}
        onTestMode={handleTestMode}
        onGoLive={handleGoLive}
        eventName={currentEvent?.name || ''}
        hasAllCommentary={hasAllCommentary}
        racesWithoutCommentary={racesWithoutCommentary}
      />
    </div>
  );
}
