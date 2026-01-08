'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, MapPin, Users, Ticket, Trophy, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Input, TextArea, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { Event } from '@/types';

export default function EditEventPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventDate: '',
    startTime: '19:00',
    venue: '',
    address: '',
    ticketPrice: 20,
    maxAttendees: 100,
    numberOfRaces: 6,
    horseDeadline: '',
    contentFilterMode: 'MODERATE',
    welcomeDrinkIncluded: false,
  });

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await api.getEvent(id);
        setEvent(data);
        
        // Parse the date and time from eventDate
        const eventDateTime = new Date(data.eventDate);
        const dateStr = eventDateTime.toISOString().split('T')[0];
        const timeStr = eventDateTime.toTimeString().slice(0, 5);
        
        const horseDeadlineDate = new Date(data.horseDeadline);
        const horseDeadlineStr = horseDeadlineDate.toISOString().split('T')[0];

        setFormData({
          name: data.name || '',
          description: data.description || '',
          eventDate: dateStr,
          startTime: timeStr,
          venue: data.venue || '',
          address: data.address || '',
          ticketPrice: data.ticketPrice || 20,
          maxAttendees: data.maxAttendees || 100,
          numberOfRaces: data.numberOfRaces || 6,
          horseDeadline: horseDeadlineStr,
          contentFilterMode: data.contentFilterMode || 'MODERATE',
          welcomeDrinkIncluded: data.welcomeDrinkIncluded || false,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Combine date and time into full ISO datetime
      const eventDateTime = new Date(`${formData.eventDate}T${formData.startTime}`).toISOString();
      
      await api.updateEvent(id, {
        name: formData.name,
        description: formData.description,
        venue: formData.venue,
        address: formData.address,
        eventDate: eventDateTime,
        ticketPrice: formData.ticketPrice,
        maxAttendees: formData.maxAttendees,
        numberOfRaces: formData.numberOfRaces,
        horseDeadline: new Date(formData.horseDeadline).toISOString(),
        contentFilterMode: formData.contentFilterMode,
        welcomeDrinkIncluded: formData.welcomeDrinkIncluded,
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/events/${id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-night">
        <Header title="Edit Event" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-night">
        <Header title="Edit Event" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center p-8">
            <p className="text-red-400">{error || 'Event not found'}</p>
            <Link href="/dashboard/events" className="mt-4 inline-block">
              <Button variant="secondary">Back to Events</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night">
      <Header title="Edit Event" subtitle={event.name} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href={`/dashboard/events/${id}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Edit Event</h1>
          <p className="text-gray-400">Update your event details</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
            Event updated successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              Event Details
            </h2>
            
            <div className="space-y-4">
              <Input
                name="name"
                label="Event Name"
                placeholder="Annual Race Night 2024"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <TextArea
                name="description"
                label="What are you fundraising for?"
                placeholder="New club jerseys, pitch renovation, youth academy equipment..."
                rows={3}
                value={formData.description}
                onChange={handleChange}
                helperText="💡 Our AI will mention this during the event to encourage donations!"
              />
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              Date & Venue
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                name="eventDate"
                label="Event Date"
                value={formData.eventDate}
                onChange={handleChange}
                required
              />

              <Input
                type="time"
                name="startTime"
                label="Start Time"
                value={formData.startTime}
                onChange={handleChange}
                required
              />

              <Input
                name="venue"
                label="Venue Name"
                placeholder="Club House"
                value={formData.venue}
                onChange={handleChange}
                required
              />

              <Input
                name="address"
                label="Address"
                placeholder="123 Main Street, Dublin"
                value={formData.address}
                onChange={handleChange}
              />

              <Input
                type="date"
                name="horseDeadline"
                label="Horse Submission Deadline"
                value={formData.horseDeadline}
                onChange={handleChange}
                helperText="When must horses be submitted by?"
              />
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-gold" />
              Tickets & Races
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="number"
                name="ticketPrice"
                label="Ticket Price (€)"
                min="0"
                step="0.50"
                value={formData.ticketPrice}
                onChange={handleChange}
                required
              />

              <Input
                type="number"
                name="maxAttendees"
                label="Max Attendees"
                min="1"
                value={formData.maxAttendees}
                onChange={handleChange}
                required
              />

              <Input
                type="number"
                name="numberOfRaces"
                label="Number of Races"
                min="1"
                max="12"
                value={formData.numberOfRaces}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="welcomeDrinkIncluded"
                  checked={formData.welcomeDrinkIncluded}
                  onChange={handleChange}
                  className="w-5 h-5 rounded bg-night-lighter border-night-lighter text-gold focus:ring-gold"
                />
                <span>Welcome drink included with ticket</span>
              </label>
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              Content Settings
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Commentary Style
              </label>
              <select
                name="contentFilterMode"
                value={formData.contentFilterMode}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-night-lighter border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
              >
                <option value="CLEAN">Family Friendly</option>
                <option value="MODERATE">Moderate (light banter)</option>
                <option value="ADULT">Adult (roast mode! 🔥)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                This controls how spicy the AI commentary will be
              </p>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <Link href={`/dashboard/events/${id}`}>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            
            <Button 
              type="submit" 
              isLoading={isSaving}
              leftIcon={<Save className="w-5 h-5" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
