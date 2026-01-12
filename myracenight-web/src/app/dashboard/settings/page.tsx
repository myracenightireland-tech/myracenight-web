'use client';

import { useState } from 'react';
import { User, Bell, Shield, CreditCard, Save } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="Settings"
        subtitle="Manage your account preferences"
      />

      <div className="p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <Card padding="sm">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gold/10 text-gold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <Card>
                <h2 className="text-xl font-display font-bold mb-6">Profile Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-racing-green rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {profile.firstName?.[0]}{profile.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <Button variant="secondary" size="sm">
                        Change Photo
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        JPG, GIF or PNG. Max size 2MB.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                    <Input
                      label="Last Name"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>

                  <Input
                    type="email"
                    label="Email Address"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />

                  <Input
                    type="tel"
                    label="Phone Number"
                    placeholder="+353 87 123 4567"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />

                  <div className="pt-4 border-t border-night-lighter">
                    <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-5 h-5" />}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <h2 className="text-xl font-display font-bold mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  {[
                    { title: 'New ticket sales', desc: 'Get notified when someone buys a ticket' },
                    { title: 'Horse submissions', desc: 'Get notified when horses need approval' },
                    { title: 'Event reminders', desc: 'Reminder before your events go live' },
                    { title: 'Weekly reports', desc: 'Receive weekly summary of your events' },
                  ].map((item, i) => (
                    <label key={i} className="flex items-start justify-between cursor-pointer p-4 bg-night-lighter rounded-lg hover:bg-night-lighter/80 transition-colors">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-5 h-5 mt-1 rounded bg-night border-night-lighter text-gold focus:ring-gold"
                      />
                    </label>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <h2 className="text-xl font-display font-bold mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Change Password</h3>
                    <div className="space-y-4 max-w-md">
                      <Input type="password" label="Current Password" />
                      <Input type="password" label="New Password" />
                      <Input type="password" label="Confirm New Password" />
                      <Button variant="secondary">Update Password</Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-night-lighter">
                    <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
                    <p className="text-gray-400 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="secondary">Enable 2FA</Button>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'billing' && (
              <Card>
                <h2 className="text-xl font-display font-bold mb-6">Billing & Payments</h2>
                
                <div className="p-6 bg-gold/10 border border-gold/20 rounded-xl mb-6">
                  <h3 className="font-semibold text-gold mb-2">Platform Fee: 15%</h3>
                  <p className="text-gray-400">
                    MyRaceNight takes a 15% fee from ticket sales. Your club receives 85% of all revenue.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Payout Details</h3>
                  <p className="text-gray-400">
                    Connect your Stripe account to receive payouts
                  </p>
                  <Button variant="secondary">Connect Stripe</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
