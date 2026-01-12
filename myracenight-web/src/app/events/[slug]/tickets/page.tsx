'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ticket, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { Button, Card, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { Event } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

export default function TicketAuthPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'create'>('login');
  
  const [loginData, setLoginData] = useState({ email: '', phone: '', password: '', pin: '', usePhone: false });
  const [createData, setCreateData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', pin: '', usePhone: false, ageVerified: false
  });

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/slug/${slug}`);
        if (!res.ok) throw new Error('Event not found');
        setEvent(await res.json());
      } catch (err: any) { setError(err.message || 'Failed to load event'); }
      finally { setIsLoading(false); }
    };
    loadEvent();
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated && user && event) router.push(`/events/${slug}/purchase`);
  }, [isAuthenticated, user, event, slug, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    try {
      const credentials = loginData.usePhone ? { phone: loginData.phone, pin: loginData.pin } : { email: loginData.email, password: loginData.password };
      const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      await checkAuth();
      router.push(`/events/${slug}/purchase`);
    } catch (err: any) { setError(err.message || 'Login failed.'); }
    finally { setIsProcessing(false); }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!createData.firstName || !createData.lastName) { setError('Please enter your name'); return; }
    if (!createData.ageVerified) { setError('You must confirm you are 18+'); return; }
    if (createData.usePhone) {
      if (!createData.phone) { setError('Please enter phone number'); return; }
      if (!/^\d{4}$/.test(createData.pin)) { setError('PIN must be 4 digits'); return; }
    } else {
      if (!createData.email?.includes('@')) { setError('Please enter valid email'); return; }
      if ((createData.password?.length || 0) < 6) { setError('Password must be 6+ chars'); return; }
      if (createData.password !== createData.confirmPassword) { setError('Passwords do not match'); return; }
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: createData.firstName, lastName: createData.lastName,
          email: createData.usePhone ? undefined : createData.email,
          password: createData.usePhone ? undefined : createData.password,
          phone: createData.usePhone ? createData.phone : undefined,
          pin: createData.usePhone ? createData.pin : undefined,
          authMethod: createData.usePhone ? 'PHONE' : 'EMAIL',
          ageVerified: createData.ageVerified,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      await checkAuth();
      router.push(`/events/${slug}/purchase`);
    } catch (err: any) { setError(err.message || 'Failed to create account'); }
    finally { setIsProcessing(false); }
  };

  if (isLoading) return <div className="min-h-screen bg-racing-black flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!event) return (
    <div className="min-h-screen bg-racing-black flex items-center justify-center">
      <Card className="max-w-md text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold mb-2">Event Not Found</h2><Link href="/"><Button>Go Home</Button></Link></Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-racing-black">
      <div className="bg-racing-black/80 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/events/${slug}`} className="flex items-center gap-2 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" />Back to Event</Link>
          <div className="flex items-center gap-2"><Ticket className="w-5 h-5 text-gold" /><span className="font-semibold text-gold">Get Tickets</span></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{event.name}</h1>
          <p className="text-gray-400">{new Date(event.eventDate).toLocaleDateString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-gold text-xl font-bold mt-2">€{event.ticketPrice} per ticket</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => { setMode('login'); setError(''); }} className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-gold text-black' : 'bg-gray-800 text-gray-300'}`}><LogIn className="w-5 h-5" />Login</button>
          <button onClick={() => { setMode('create'); setError(''); }} className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${mode === 'create' ? 'bg-gold text-black' : 'bg-gray-800 text-gray-300'}`}><UserPlus className="w-5 h-5" />Create Account</button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-400">{error}</p></div>}

        {mode === 'login' && (
          <Card>
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Welcome Back</h2>
              <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
                <button type="button" onClick={() => setLoginData({ ...loginData, usePhone: false })} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${!loginData.usePhone ? 'bg-gold text-black' : 'text-gray-400'}`}>Email</button>
                <button type="button" onClick={() => setLoginData({ ...loginData, usePhone: true })} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${loginData.usePhone ? 'bg-gold text-black' : 'text-gray-400'}`}>Phone</button>
              </div>
              {loginData.usePhone ? (
                <>
                  <div><label className="block text-sm text-gray-300 mb-1">Phone</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="tel" value={loginData.phone} onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })} placeholder="+353 87 123 4567" className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none" /></div></div>
                  <div><label className="block text-sm text-gray-300 mb-1">PIN</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="password" maxLength={4} value={loginData.pin} onChange={(e) => setLoginData({ ...loginData, pin: e.target.value.replace(/\D/g, '') })} placeholder="••••" className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none tracking-widest text-center" /></div></div>
                </>
              ) : (
                <>
                  <div><label className="block text-sm text-gray-300 mb-1">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="email" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} placeholder="your@email.com" className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none" /></div></div>
                  <div><label className="block text-sm text-gray-300 mb-1">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type={showPassword ? 'text' : 'password'} value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
                </>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>{isProcessing ? <Spinner size="sm" /> : 'Login & Continue'}</Button>
            </form>
          </Card>
        )}

        {mode === 'create' && (
          <Card>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Create Your Account</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-300 mb-1">First Name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="text" value={createData.firstName} onChange={(e) => setCreateData({ ...createData, firstName: e.target.value })} placeholder="John" className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none" /></div></div>
                <div><label className="block text-sm text-gray-300 mb-1">Last Name</label><input type="text" value={createData.lastName} onChange={(e) => setCreateData({ ...createData, lastName: e.target.value })} placeholder="Murphy" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none" /></div>
              </div>
              <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
                <button type="button" onClick={() => setCreateData({ ...createData, usePhone: false })} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${!createData.usePhone ? 'bg-gold text-black' : 'text-gray-400'}`}>Email</button>
                <button type="button" onClick={() => setCreateData({ ...createData, usePhone: true })} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium ${createData.usePhone ? 'bg-gold text-black' : 'text-gray-400'}`}>Phone</button>
              </div>
              {createData.usePhone ? (
                <>
                  <div><label className="block text-sm text-gray-300 mb-1">Phone</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="tel" value={createData.phone} onChange={(e) => setCreateData({ ...createData, phone: e.target.value })} placeholder="+353 87 123 4567" className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none" /></div></div>
                  <div><label className="block text-sm text-gray-300 mb-1">4-Digit PIN</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="password" maxLength={4} value={createData.pin} onChange={(e) => setCreateData({ ...createData, pin: e.target.value.replace(/\D/g, '') })} placeholder="••••" className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none tracking-widest text-center" /></div></div>
                </>
              ) : (
                <>
                  <div><label className="block text-sm text-gray-300 mb-1">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="email" value={createData.email} onChange={(e) => setCreateData({ ...createData, email: e.target.value })} placeholder="your@email.com" className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none" /></div></div>
                  <div><label className="block text-sm text-gray-300 mb-1">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type={showPassword ? 'text' : 'password'} value={createData.password} onChange={(e) => setCreateData({ ...createData, password: e.target.value })} placeholder="Min 6 characters" className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
                  <div><label className="block text-sm text-gray-300 mb-1">Confirm Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type={showPassword ? 'text' : 'password'} value={createData.confirmPassword} onChange={(e) => setCreateData({ ...createData, confirmPassword: e.target.value })} className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-gold focus:outline-none" /></div></div>
                </>
              )}
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <input type="checkbox" checked={createData.ageVerified} onChange={(e) => setCreateData({ ...createData, ageVerified: e.target.checked })} className="w-5 h-5 mt-0.5 rounded border-gray-600 text-gold bg-gray-700" />
                <span className="text-sm text-gray-300">I confirm I am <strong className="text-white">18 years or older</strong></span>
              </label>
              <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>{isProcessing ? <Spinner size="sm" /> : 'Create Account & Continue'}</Button>
            </form>
          </Card>
        )}
        <p className="text-center text-gray-500 text-sm mt-6">After signing in, you'll be able to purchase your ticket.</p>
      </div>
    </div>
  );
}
