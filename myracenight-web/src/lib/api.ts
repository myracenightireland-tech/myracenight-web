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

  async completeRace(raceId: string, winningPosition: number): Promise<Race> {
    return this.request<Race>(`/races/${raceId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ winningPosition }),
    });
  }

  // Bet endpoints
  async placeBet(data: { raceId: string; horseId: string; amount: number }): Promise<Bet> {
    return this.request<Bet>('/bets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserBets(userId: string): Promise<Bet[]> {
    return this.request<Bet[]>(`/bets/user/${userId}`);
  }

  // Credit endpoints
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
}

export const api = new ApiClient();
