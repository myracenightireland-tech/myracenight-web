'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Save } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Input, TextArea } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const SPORTS = ['GAA', 'Rugby', 'Soccer', 'Hurling', 'Camogie', 'Other'];
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
      const club = await api.createClub(formData);
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

            <TextArea
              name="description"
              label="Description"
              placeholder="A brief description of your club..."
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sport
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

            <TextArea
              name="achievements"
              label="Club Achievements (Optional)"
              placeholder="County Champions 2023, Division 1 League..."
              rows={2}
              value={formData.achievements}
              onChange={handleChange}
            />

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
