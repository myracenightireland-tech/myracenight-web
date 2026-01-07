import { AuthResponse, LoginCredentials, RegisterData, User, Club, Event, Horse, Race, Ticket, Bet } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

class ApiClient {
  private accessToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  setToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}/api${endpoint}`;
    
    // Always get fresh token from localStorage
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.accessToken);
    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.accessToken);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    this.setToken(response.accessToken);
    return response;
  }

  // User endpoints
  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Club endpoints
  async getClubs(): Promise<Club[]> {
    return this.request<Club[]>('/clubs');
  }

  async getClub(id: string): Promise<Club> {
    return this.request<Club>(`/clubs/${id}`);
  }

  async createClub(data: Partial<Club>): Promise<Club> {
    return this.request<Club>('/clubs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClub(id: string, data: Partial<Club>): Promise<Club> {
    return this.request<Club>(`/clubs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Event endpoints
  async getEvents(): Promise<Event[]> {
    return this.request<Event[]>('/events');
  }

  async getEvent(id: string): Promise<Event> {
    return this.request<Event>(`/events/${id}`);
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    return this.request<Event>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async generateRaces(eventId: string): Promise<Event> {
    return this.request<Event>(`/events/${eventId}/generate-races`, {
      method: 'POST',
    });
  }

  async deleteEvent(id: string): Promise<void> {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  }

  // Ticket endpoints
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    return this.request<Ticket[]>(`/tickets/event/${eventId}`);
  }

  async getUserTickets(userId: string): Promise<Ticket[]> {
    return this.request<Ticket[]>(`/tickets/user/${userId}`);
  }

  async checkInTicket(qrCode: string): Promise<Ticket> {
    return this.request<Ticket>('/tickets/check-in', {
      method: 'POST',
      body: JSON.stringify({ qrCode }),
    });
  }

  // Horse endpoints
  async getEventHorses(eventId: string): Promise<Horse[]> {
    return this.request<Horse[]>(`/horses/event/${eventId}`);
  }

  async createHorse(data: Partial<Horse>): Promise<Horse> {
    return this.request<Horse>('/horses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveHorse(id: string): Promise<Horse> {
    return this.request<Horse>(`/horses/${id}/approve`, { method: 'PATCH' });
  }

  async flagHorse(id: string, notes?: string): Promise<Horse> {
    return this.request<Horse>(`/horses/${id}/flag`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectHorse(id: string, notes?: string): Promise<Horse> {
    return this.request<Horse>(`/horses/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  async assignHorseToRace(horseId: string, raceId: string): Promise<Horse> {
    return this.request<Horse>(`/horses/${horseId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ raceId }),
    });
  }

  async updateHorseStatus(id: string, status: string, notes?: string): Promise<Horse> {
    return this.request<Horse>(`/horses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  async unassignHorseFromRace(id: string): Promise<Horse> {
    return this.request<Horse>(`/horses/${id}/unassign`, {
      method: 'PATCH',
    });
  }

  // Race endpoints
  async getEventRaces(eventId: string): Promise<Race[]> {
    return this.request<Race[]>(`/races/event/${eventId}`);
  }

  async getRace(id: string): Promise<Race> {
    return this.request<Race>(`/races/${id}`);
  }

  async createRace(data: Partial<Race>): Promise<Race> {
    return this.request<Race>('/races', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRace(id: string, data: Partial<Race>): Promise<Race> {
    return this.request<Race>(`/races/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async startBetting(raceId: string): Promise<Race> {
    return this.request<Race>(`/races/${raceId}/start-betting`, { method: 'PATCH' });
  }

  async closeBetting(raceId: string): Promise<Race> {
    return this.request<Race>(`/races/${raceId}/close-betting`, { method: 'PATCH' });
  }

  async startRace(raceId: string): Promise<Race> {
    return this.request<Race>(`/races/${raceId}/start`, { method: 'PATCH' });
  }

  async completeRace(raceId: string, winningPosition?: number): Promise<Race> {
    return this.request<Race>(`/races/${raceId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ winningPosition }),
    });
  }

  // Bet endpoints
  async placeBet(data: { 
    eventId: string;
    raceId: string; 
    horseId: string; 
    amount: number;
    betType?: 'WIN' | 'EACH_WAY';
  }): Promise<Bet> {
    return this.request<Bet>('/bets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyBets(eventId?: string, raceId?: string): Promise<Bet[]> {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (raceId) params.append('raceId', raceId);
    return this.request<Bet[]>(`/bets/my-bets?${params.toString()}`);
  }

  async getUserBets(userId: string): Promise<Bet[]> {
    return this.request<Bet[]>(`/bets/user/${userId}`);
  }

  async getRaceBets(raceId: string): Promise<Bet[]> {
    return this.request<Bet[]>(`/bets/race/${raceId}`);
  }

  // Credit endpoints
  async getMyBalance(eventId: string): Promise<{ userId: string; eventId: string; balance: number }> {
    return this.request<{ userId: string; eventId: string; balance: number }>(`/credits/my-balance/${eventId}`);
  }

  async initializeCredits(eventId: string, amount?: number): Promise<{ balance: number; initialized: boolean }> {
    return this.request<{ balance: number; initialized: boolean }>('/credits/initialize', {
      method: 'POST',
      body: JSON.stringify({ eventId, amount }),
    });
  }

  async getLeaderboard(eventId: string, limit?: number): Promise<any[]> {
    return this.request<any[]>(`/credits/leaderboard/${eventId}?limit=${limit || 20}`);
  }

  async getMyLedger(eventId: string, limit?: number): Promise<any[]> {
    return this.request<any[]>(`/credits/my-ledger/${eventId}?limit=${limit || 50}`);
  }

  async getBalance(userId: string): Promise<{ balance: number }> {
    return this.request<{ balance: number }>(`/credits/balance/${userId}`);
  }

  async getLedger(userId: string): Promise<{ transactions: any[] }> {
    return this.request<{ transactions: any[] }>(`/credits/ledger/${userId}`);
  }

  // Notification endpoints
  async getNotifications(userId: string): Promise<Notification[]> {
    return this.request<Notification[]>(`/notifications/user/${userId}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Commentary endpoints (v10)
  async generateCommentary(raceId: string): Promise<any> {
    return this.request(`/commentary/generate/${raceId}`, {
      method: 'POST',
    });
  }

  async getCommentaryStatus(raceId: string): Promise<{ hasCommentary: boolean; status: string; error?: string }> {
    return this.request(`/commentary/status/${raceId}`);
  }

  // Commentary endpoints v38 - Single Race Generation
  async getRaceInfo(raceId: string): Promise<{
    success: boolean;
    raceId: string;
    horseCounts: {
      assigned: number;
      autoGenerated: number;
      total: number;
    };
    commentaryStatus: any;
    needsAutoFill: boolean;
    positionsToFill: number;
  }> {
    return this.request(`/commentary/race-info/${raceId}`);
  }

  async generateSingleRaceCommentary(
    raceId: string,
    options?: {
      autoFill?: boolean;
      totalPositions?: number;
      uploadToCloudflare?: boolean;
    }
  ): Promise<any> {
    return this.request(`/commentary/generate-single/${raceId}`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async autoFillRace(raceId: string, totalPositions = 11): Promise<{
    success: boolean;
    filled: number;
    total: number;
  }> {
    return this.request(`/commentary/auto-fill/${raceId}`, {
      method: 'POST',
      body: JSON.stringify({ totalPositions }),
    });
  }

  // Get locked-in race card with all horse details (NEW v38)
  async getRaceCard(raceId: string): Promise<{
    success: boolean;
    raceCard: {
      raceId: string;
      raceNumber: number;
      raceName: string;
      eventName: string;
      totalHorses: number;
      horses: Array<{
        id: string;
        position: number;
        name: string;
        ownerName: string;
        jockeyName: string;
        silks: string;
        odds: string;
        oddsNumeric: number;
        isAutoGenerated: boolean;
      }>;
      lockedAt: string;
      commentaryReady: boolean;
    };
  }> {
    return this.request(`/commentary/race-card/${raceId}`);
  }

  // Test Mode endpoints (v10)
  async startTestMode(eventId: string): Promise<any> {
    return this.request(`/events/${eventId}/test-mode/start`, {
      method: 'POST',
    });
  }

  async stopTestMode(eventId: string): Promise<any> {
    return this.request(`/events/${eventId}/test-mode/stop`, {
      method: 'POST',
    });
  }

  async getTestModeStatus(eventId: string): Promise<{ isTestMode: boolean; startedAt?: Date }> {
    return this.request(`/events/${eventId}/test-mode/status`);
  }

  // ============= CREDIT TOP-UP =============

  async getTopUpInfo(eventId: string): Promise<{
    available: boolean;
    hasUsed: boolean;
    topUpAmount: number;
    topUpPrice: number;
    currentBalance: number;
    message: string;
  }> {
    return this.request(`/credits/top-up-info/${eventId}`);
  }

  async processTopUp(eventId: string): Promise<{
    success: boolean;
    creditsAdded: number;
    pricePaid: number;
    newBalance: number;
    message: string;
  }> {
    return this.request('/credits/top-up', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    });
  }

  // ============= EVENT SUMMARY =============

  async getEventSummary(eventId: string): Promise<{
    event: {
      id: string;
      name: string;
      status: string;
      date: string;
      venue: string;
      club: string;
    };
    statistics: {
      totalRaces: number;
      completedRaces: number;
      totalParticipants: number;
      totalBetsPlaced: number;
      totalCreditsWagered: number;
      winningBets: number;
      userHorsesWon: number;
    };
    raceResults: Array<{
      raceNumber: number;
      raceName: string;
      status: string;
      podium: {
        first: { horseName: string; ownerName: string; isUserSubmitted: boolean; submittedBy: string | null } | null;
        second: { horseName: string; ownerName: string; isUserSubmitted: boolean; submittedBy: string | null } | null;
        third: { horseName: string; ownerName: string; isUserSubmitted: boolean; submittedBy: string | null } | null;
      };
    }>;
    topPunters: Array<{
      rank: number;
      userId: string;
      name: string;
      finalBalance: number;
      winningBets: number;
      totalBets: number;
      winRate: number;
    }>;
    topPunter: {
      rank: number;
      userId: string;
      name: string;
      finalBalance: number;
    } | null;
  }> {
    return this.request(`/events/${eventId}/summary`);
  }

  // ============= NOTIFICATIONS =============

  async getMyNotifications(): Promise<Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    status: string;
    createdAt: string;
  }>> {
    return this.request('/notifications/my-notifications');
  }

  // ============= UNIFIED DASHBOARD =============

  async getDashboardData(): Promise<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
    hostedEvents: Array<{
      id: string;
      name: string;
      slug: string;
      eventDate: string;
      venue: string;
      status: string;
      club: { id: string; name: string } | null;
      ticketsSold: number;
      horsesSubmitted: number;
      racesCount: number;
      maxAttendees: number;
    }>;
    attendingEvents: Array<{
      id: string;
      name: string;
      slug: string;
      eventDate: string;
      venue: string;
      status: string;
      ticketPrice: number;
      club: { id: string; name: string } | null;
      userHorsesCount: number;
    }>;
    isHost: boolean;
    isAttendee: boolean;
    isSuperAdmin: boolean;
  }> {
    return this.request('/users/dashboard-data');
  }

  async getMyHostedEvents(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    eventDate: string;
    venue: string;
    status: string;
    club: { id: string; name: string } | null;
    ticketsSold: number;
    horsesSubmitted: number;
    racesCount: number;
    maxAttendees: number;
  }>> {
    return this.request('/users/my-hosted-events');
  }
}

export const api = new ApiClient();
