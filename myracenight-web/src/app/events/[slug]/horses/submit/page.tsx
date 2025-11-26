'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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

export default function SubmitHorsePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    backstory: '',
    catchphrase: '',
    silksDescription: '',
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
        if (user) {
          setFormData(prev => ({
            ...prev,
            ownerName: `${user.firstName} ${user.lastName}`.trim()
          }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [slug, user]);

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
              <Link href={`/events/${slug}`}>
                <Button variant="secondary">Back to Event</Button>
              </Link>
              <Button onClick={() => {
                setSuccess(false);
                setFormData({
                  name: '',
                  ownerName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
                  backstory: '',
                  catchphrase: '',
                  silksDescription: '',
                });
              }}>
                Submit Another Horse
              </Button>
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

                <TextArea
                  name="silksDescription"
                  label="Jockey Silks Description (Optional)"
                  placeholder="Describe what your jockey is wearing - e.g., 'Hot pink with yellow polka dots and a top hat'"
                  rows={2}
                  value={formData.silksDescription}
                  onChange={handleChange}
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
