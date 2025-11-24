'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Users, Ticket, Trophy, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Input, TextArea } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Club } from '@/types';

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    clubId: '',
    name: '',
    fundraisingCause: '',
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
    const loadClubs = async () => {
      try {
        const data = await api.getClubs();
        setClubs(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, clubId: data[0].id }));
        }
      } catch (error) {
        console.error('Failed to load clubs:', error);
      }
    };
    loadClubs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const event = await api.createEvent({
        ...formData,
        description: formData.fundraisingCause, // Map to description for backend
        organiserId: user?.id,
        eventDate: new Date(formData.eventDate).toISOString(),
        horseDeadline: new Date(formData.horseDeadline || formData.eventDate).toISOString(),
      });
      router.push(`/dashboard/events/${event.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: Calendar },
    { number: 2, title: 'Location', icon: MapPin },
    { number: 3, title: 'Tickets & Races', icon: Ticket },
    { number: 4, title: 'Settings', icon: Trophy },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="Create New Event"
        subtitle="Set up your race night in a few simple steps"
      />

      <div className="p-8 max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    step >= s.number
                      ? 'bg-gold text-night'
                      : 'bg-night-lighter text-gray-500'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  step >= s.number ? 'text-white' : 'text-gray-500'
                }`}>
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-24 h-1 mx-4 rounded ${
                  step > s.number ? 'bg-gold' : 'bg-night-lighter'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Form Steps */}
        <Card className="mb-8">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-display font-bold mb-6">Basic Information</h2>

              {clubs.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Club
                  </label>
                  <select
                    name="clubId"
                    value={formData.clubId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-night-lighter border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
                  >
                    {clubs.map(club => (
                      <option key={club.id} value={club.id}>{club.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                name="name"
                label="Event Name"
                placeholder="St. Patrick's GAA Race Night 2025"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <TextArea
                name="fundraisingCause"
                label="What are you fundraising for?"
                placeholder="New club jerseys, pitch renovation, youth academy equipment, building fund..."
                rows={3}
                value={formData.fundraisingCause}
                onChange={handleChange}
                helperText="💡 Our AI will mention this during the event to encourage donations!"
              />

              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-display font-bold mb-6">Location Details</h2>

              <Input
                name="venue"
                label="Venue Name"
                placeholder="Club House, The Green"
                value={formData.venue}
                onChange={handleChange}
                required
              />

              <TextArea
                name="address"
                label="Full Address"
                placeholder="123 Main Street, Dublin, Ireland"
                rows={3}
                value={formData.address}
                onChange={handleChange}
              />

              <div className="p-4 bg-night-lighter rounded-lg">
                <p className="text-sm text-gray-400">
                  💡 <strong>Tip:</strong> Make sure the venue has good WiFi and a projector for displaying the races!
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-display font-bold mb-6">Tickets & Races</h2>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  name="ticketPrice"
                  label="Ticket Price (€)"
                  value={formData.ticketPrice}
                  onChange={handleChange}
                  min={5}
                  max={100}
                  required
                />
                <Input
                  type="number"
                  name="maxAttendees"
                  label="Max Attendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  min={10}
                  max={500}
                  required
                />
              </div>

              <div className="p-4 bg-gold/10 border border-gold/20 rounded-lg">
                <p className="text-sm">
                  <span className="text-gold font-semibold">Starting Credits:</span>{' '}
                  Each attendee gets <strong>{formData.ticketPrice * 1000}</strong> credits to bet with!
                </p>
              </div>

              <Input
                type="number"
                name="numberOfRaces"
                label="Number of Races"
                value={formData.numberOfRaces}
                onChange={handleChange}
                min={4}
                max={12}
                helperText="Recommended: 6-8 races for a 2-3 hour event"
              />

              <Input
                type="datetime-local"
                name="horseDeadline"
                label="Horse Submission Deadline"
                value={formData.horseDeadline}
                onChange={handleChange}
                helperText="When should attendees submit their horses by?"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-display font-bold mb-6">Event Settings</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content Filter Mode
                </label>
                <select
                  name="contentFilterMode"
                  value={formData.contentFilterMode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-night-lighter border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  <option value="STRICT">Strict - Family friendly only</option>
                  <option value="MODERATE">Moderate - Some adult humor allowed</option>
                  <option value="RELAXED">Relaxed - Adults only event</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Controls AI moderation of horse backstories
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 bg-night-lighter rounded-lg hover:bg-night-lighter/80 transition-colors">
                <input
                  type="checkbox"
                  name="welcomeDrinkIncluded"
                  checked={formData.welcomeDrinkIncluded}
                  onChange={handleChange}
                  className="w-5 h-5 rounded bg-night border-night-lighter text-gold focus:ring-gold"
                />
                <div>
                  <span className="font-medium">Welcome drink included</span>
                  <p className="text-sm text-gray-500">Show this perk on the ticket page</p>
                </div>
              </label>

              {/* Summary */}
              <div className="mt-8 p-6 bg-racing-green/10 border border-racing-green-light/20 rounded-xl">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" />
                  Event Summary
                </h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Event</dt>
                    <dd className="font-medium">{formData.name || 'Untitled'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Date</dt>
                    <dd className="font-medium">{formData.eventDate || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Ticket Price</dt>
                    <dd className="font-medium">€{formData.ticketPrice}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Max Revenue</dt>
                    <dd className="font-medium text-gold">
                      €{(formData.ticketPrice * formData.maxAttendees * 0.85).toFixed(0)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} leftIcon={<ArrowLeft className="w-5 h-5" />}>
                Back
              </Button>
            ) : (
              <Link href="/dashboard/events">
                <Button variant="ghost" leftIcon={<ArrowLeft className="w-5 h-5" />}>
                  Cancel
                </Button>
              </Link>
            )}
          </div>

          <div>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} rightIcon={<ArrowRight className="w-5 h-5" />}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} isLoading={isLoading} rightIcon={<Trophy className="w-5 h-5" />}>
                Create Event
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
