'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Sparkles, Mic, Send, AlertCircle, CheckCircle,
  Lightbulb, MessageSquare
} from 'lucide-react';
import { Button, Card, Input, TextArea, Spinner, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Event } from '@/types';

const HORSE_NAME_SUGGESTIONS = [
  "Whiskey Business",
  "Neigh Sayer",
  "Hoof Hearted",
  "Sir Trots-a-Lot",
  "Glue Factory Reject",
  "Oats McGoats",
  "Hay There Delilah",
  "Clip Clop Champion",
  "Gallop Poll",
  "Mane Event"
];

export default function SubmitHorsePage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [existingHorses, setExistingHorses] = useState<any[]>([]);
  const [useSameJockey, setUseSameJockey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    backstory: '',
    catchphrase: '',
    jockeyName: '',
    jockeyPersonality: '',
  });

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app'}/api/events/by-slug/${slug}`
        );
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        setEvent(data);
        
        // Pre-fill owner name if logged in
        let ownerName = '';
        if (user) {
          ownerName = `${user.firstName} ${user.lastName}`.trim();
          setFormData(prev => ({
            ...prev,
            ownerName
          }));
        }

        // Load existing horses by this owner for jockey reuse
        if (data.horses && data.horses.length > 0 && ownerName) {
          const userHorses = data.horses.filter((h: any) => 
            h.ownerName.toLowerCase() === ownerName.toLowerCase()
          );
          setExistingHorses(userHorses);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [slug, user]);

  useEffect(() => {
    if (useSameJockey && existingHorses.length > 0) {
      const lastHorse = existingHorses[existingHorses.length - 1];
      if (lastHorse.jockeyName) {
        setFormData(prev => ({
          ...prev,
          jockeyName: lastHorse.jockeyName,
          jockeyPersonality: lastHorse.jockeyPersonality || ''
        }));
      }
    } else if (!useSameJockey) {
      // Clear jockey fields if unchecked
      setFormData(prev => ({
        ...prev,
        jockeyName: '',
        jockeyPersonality: ''
      }));
    }
  }, [useSameJockey, existingHorses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSuggestion = () => {
    const randomName = HORSE_NAME_SUGGESTIONS[Math.floor(Math.random() * HORSE_NAME_SUGGESTIONS.length)];
    setFormData(prev => ({ ...prev, name: randomName }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      await api.createHorse({
        eventId: event.id,
        ...formData,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit horse');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center">
        <Card className="text-center p-8">
          <p className="text-red-400">{error || 'Event not found'}</p>
        </Card>
      </div>
    );
  }

  const horseDeadline = new Date(event.horseDeadline);
  const canSubmit = horseDeadline > new Date();

  if (success) {
    return (
      <div className="min-h-screen bg-night">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="text-center p-8">
            <div className="w-20 h-20 bg-racing-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-racing-green-light" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-4">Horse Submitted! 🏇</h1>
            <p className="text-gray-400 mb-2">
              <span className="text-white font-semibold">{formData.name}</span> has been entered into {event.name}
            </p>
            <p className="text-gray-500 text-sm mb-8">
              The event organisers will review your submission. You'll be notified once it's approved!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/events/${slug}/my-dashboard`}>
                <Button>Go to My Dashboard</Button>
              </Link>
              <Link href={`/events/${slug}`}>
                <Button variant="secondary">Back to Event</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/events/${slug}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to {event.name}
        </Link>

        <div className="mb-8">
          <Badge variant="success" className="mb-4">{event.name}</Badge>
          <h1 className="text-3xl font-display font-bold mb-2">Create Your Horse 🐴</h1>
          <p className="text-gray-400">
            Give your horse a name and backstory. The funnier, the better - our AI commentator will bring them to life!
          </p>
        </div>

        {!canSubmit ? (
          <Card className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Submission Deadline Passed</h2>
            <p className="text-gray-400">
              Sorry, the deadline for horse submissions was {horseDeadline.toLocaleDateString('en-IE', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </Card>
        ) : (
          <>
            {/* Tips Card */}
            <Card className="mb-6 bg-gold/5 border-gold/20">
              <div className="flex gap-3">
                <Lightbulb className="w-6 h-6 text-gold flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gold mb-2">Tips for a Great Horse</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• <strong>Punny names</strong> are always a hit (e.g., "Neigh Sayer", "Hoof Hearted")</li>
                    <li>• Add <strong>inside jokes</strong> about your friends or colleagues</li>
                    <li>• Give your horse a <strong>ridiculous backstory</strong> - the AI will run with it!</li>
                    <li>• Include a <strong>catchphrase</strong> for the commentator to use</li>
                  </ul>
                </div>
              </div>
            </Card>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        name="name"
                        label="Horse Name"
                        placeholder="Enter a hilarious horse name..."
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={handleSuggestion}
                      className="mb-1"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Suggest
                    </Button>
                  </div>
                </div>

                <Input
                  name="ownerName"
                  label="Owner Name (Your Name)"
                  placeholder="How should we announce you?"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  helperText="This is how the commentator will introduce your horse's owner"
                />

                <TextArea
                  name="backstory"
                  label="Horse Backstory"
                  placeholder="Tell us your horse's ridiculous origin story... Was it raised by cats? Did it once win a hotdog eating contest? The weirder the better!"
                  rows={4}
                  value={formData.backstory}
                  onChange={handleChange}
                  required
                  helperText="💡 Our AI commentator uses this to create hilarious race commentary!"
                />

                <Input
                  name="catchphrase"
                  label="Catchphrase (Optional)"
                  placeholder="e.g., 'Born to run, trained to nap!'"
                  value={formData.catchphrase}
                  onChange={handleChange}
                  helperText="A signature phrase the commentator can use"
                />

                {/* Jockey Reuse Option */}
                {existingHorses.length > 0 && existingHorses[existingHorses.length - 1].jockeyName && (
                  <div className="p-4 bg-gold/10 border border-gold/20 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSameJockey}
                        onChange={(e) => setUseSameJockey(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-gold/40 bg-night-light text-gold focus:ring-gold focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Use same jockey as "{existingHorses[existingHorses.length - 1].name}"
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          Jockey: <span className="text-white font-medium">{existingHorses[existingHorses.length - 1].jockeyName}</span>
                          {' • '}This allows the AI to create storylines like "Adam rode winner earlier, going for double!"
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <Input
                  name="jockeyName"
                  label="Jockey Name (Optional)"
                  placeholder="e.g., 'Tiny Tony', 'Lightning Lucy'"
                  value={formData.jockeyName}
                  onChange={handleChange}
                  disabled={useSameJockey}
                  helperText="Give your jockey a fun name!"
                />

                <TextArea
                  name="jockeyPersonality"
                  label="Jockey Personality & Riding Style (Optional)"
                  placeholder="e.g., 'Nervous wreck who closes his eyes at the finish line', 'Former ballet dancer with impeccable posture', 'Talks to the horse constantly during races'"
                  rows={2}
                  value={formData.jockeyPersonality}
                  onChange={handleChange}
                  disabled={useSameJockey}
                  helperText="💡 The commentator will mention their quirks during the race!"
                />

                <div className="pt-4 border-t border-night-lighter">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    isLoading={isSubmitting}
                    leftIcon={<Send className="w-5 h-5" />}
                  >
                    Submit Horse
                  </Button>
                  <p className="text-center text-xs text-gray-500 mt-3">
                    Deadline: {horseDeadline.toLocaleDateString('en-IE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </form>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
