'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Save, Sparkles, Info } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Input, TextArea } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const SPORTS = [
  'GAA',
  'Rugby', 
  'Soccer', 
  'Boxing',
  'MMA',
  'Golf',
  'Badminton',
  'Tennis',
  'Athletics',
  'Swimming',
  'Corporate',
  'Other'
];

const COUNTIES = [
  'Antrim', 'Armagh', 'Carlow', 'Cavan', 'Clare', 'Cork', 'Derry', 'Donegal',
  'Down', 'Dublin', 'Fermanagh', 'Galway', 'Kerry', 'Kildare', 'Kilkenny',
  'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath',
  'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Tyrone',
  'Waterford', 'Westmeath', 'Wexford', 'Wicklow'
];

export default function NewClubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport: 'GAA',
    county: 'Dublin',
    contactEmail: user?.email || '',
    contactPhone: '',
    achievements: '',
    rivals: '',
    funFacts: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Combine extra info into description for AI context
      const enhancedDescription = [
        formData.description,
        formData.rivals ? `Rivals: ${formData.rivals}` : '',
        formData.funFacts ? `Fun facts: ${formData.funFacts}` : '',
      ].filter(Boolean).join('\n\n');

      const club = await api.createClub({
        ...formData,
        description: enhancedDescription,
      });
      router.push(`/dashboard/clubs`);
    } catch (err: any) {
      setError(err.message || 'Failed to create club');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Create New Club"
        subtitle="Set up your club profile"
      />

      <div className="p-8 max-w-2xl mx-auto">
        <Link href="/dashboard/clubs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Clubs
        </Link>

        {/* AI Info Banner */}
        <div className="mb-6 p-4 bg-gold/10 border border-gold/30 rounded-xl">
          <div className="flex gap-3">
            <Sparkles className="w-6 h-6 text-gold flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gold mb-1">Why we need this info</h3>
              <p className="text-sm text-gray-300">
                Our AI commentator uses your club details to create personalised, entertaining race commentary. 
                The more you share about your club's history, rivals, and quirks, the funnier and more engaging 
                the commentary will be on the night!
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-racing-green/20 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-racing-green-light" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">Club Details</h2>
                <p className="text-gray-400 text-sm">Tell us about your club</p>
              </div>
            </div>

            <Input
              name="name"
              label="Club Name"
              placeholder="St. Patrick's GAA Club"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sport / Organisation Type
                </label>
                <select
                  name="sport"
                  value={formData.sport}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-night-lighter border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  {SPORTS.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  County
                </label>
                <select
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-night-lighter border border-night-lighter rounded-lg text-white focus:outline-none focus:border-gold"
                >
                  {COUNTIES.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
            </div>

            <TextArea
              name="description"
              label="About Your Club"
              placeholder="Tell us your club's story - when was it founded, what makes it special, any memorable moments..."
              rows={3}
              value={formData.description}
              onChange={handleChange}
              helperText="💡 This helps our AI create personalised commentary!"
            />

            <div className="p-4 bg-night-lighter/50 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-sm text-gold">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">AI Commentary Boosters</span>
              </div>
              
              <TextArea
                name="achievements"
                label="Club Achievements & Bragging Rights"
                placeholder="County Champions 2023, Division 1 League, unbeaten in local derby for 5 years..."
                rows={2}
                value={formData.achievements}
                onChange={handleChange}
                helperText="What should the AI boast about?"
              />

              <Input
                name="rivals"
                label="Club Rivals"
                placeholder="Ballymore FC, St. Mary's GAA..."
                value={formData.rivals}
                onChange={handleChange}
                helperText="The AI can playfully slag your rivals during commentary! 😈"
              />

              <TextArea
                name="funFacts"
                label="Fun Facts & Inside Jokes"
                placeholder="Tommy always misses penalties, the clubhouse tea is legendary, we've never won in the rain..."
                rows={2}
                value={formData.funFacts}
                onChange={handleChange}
                helperText="The weirder the better - this makes the AI hilarious!"
              />
            </div>

            <div className="pt-4 border-t border-night-lighter">
              <h3 className="font-medium mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="email"
                  name="contactEmail"
                  label="Contact Email"
                  placeholder="info@yourclub.ie"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                />

                <Input
                  type="tel"
                  name="contactPhone"
                  label="Contact Phone"
                  placeholder="+353 87 123 4567"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-night-lighter">
              <Link href="/dashboard/clubs" className="flex-1">
                <Button variant="ghost" type="button" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="flex-1"
                isLoading={isLoading}
                leftIcon={<Save className="w-5 h-5" />}
              >
                Create Club
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
