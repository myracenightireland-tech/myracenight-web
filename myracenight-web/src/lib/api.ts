import { AuthResponse, LoginCredentials, RegisterData, User, Club, Event, Horse, Race, Ticket, Bet } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://myracenight-backend-production.up.railway.app';

class ApiClient {
  private accessToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

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

  /**
   * Attempt to refresh the access token using stored refresh token
   * Returns true if successful, false otherwise
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for that to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;

    if (!refreshToken) {
      console.log('[API] No refresh token available');
      return false;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log('[API] Attempting token refresh...');
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          console.log('[API] Token refresh failed:', response.status);
          return false;
        }

        const data = await response.json();
        
        // Update tokens
        this.setToken(data.accessToken);
        if (typeof window !== 'undefined' && data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        // Also update auth-storage for Zustand persistence
        if (typeof window !== 'undefined') {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            try {
              const parsed = JSON.parse(authStorage);
              if (parsed.state) {
                parsed.state.accessToken = data.accessToken;
                if (data.refreshToken) {
                  parsed.state.refreshToken = data.refreshToken;
                }
                localStorage.setItem('auth-storage', JSON.stringify(parsed));
              }
            } catch (e) {
              console.error('[API] Failed to update auth-storage:', e);
            }
          }
        }

        console.log('[API] Token refresh successful');
        return true;
      } catch (error) {
        console.error('[API] Token refresh error:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Clear all auth state - called when refresh fails
   */
  private clearAuthState() {
    this.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
      // Clear Zustand auth storage
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          if (parsed.state) {
            parsed.state.accessToken = null;
            parsed.state.refreshToken = null;
            parsed.state.isAuthenticated = false;
            parsed.state.user = null;
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
          }
        } catch (e) {
          console.error('[API] Failed to clear auth-storage:', e);
        }
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
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

    // Check if this is an auth endpoint - don't try token refresh for these
    const isAuthEndpoint = endpoint.startsWith('/auth/');

    // Handle 401 Unauthorized - try token refresh once (but NOT for auth endpoints)
    if (response.status === 401 && !isRetry && !isAuthEndpoint) {
      console.log('[API] Got 401, attempting token refresh...');
      const refreshed = await this.attemptTokenRefresh();
      
      if (refreshed) {
        console.log('[API] Retrying request after token refresh');
        // Retry the original request with new token
        return this.request<T>(endpoint, options, true);
      }
      // If refresh failed, just fall through to the error handling below
      // Don't automatically redirect - let the app handle it
      console.log('[API] Token refresh failed, returning 401 error');
    }

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
    if (typeof window !== 'undefined' && response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    return response;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.accessToken);
    if (typeof window !== 'undefined' && response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuthState();
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    this.setToken(response.accessToken);
    if (typeof window !== 'undefined' && response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
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

  async duplicateEvent(eventId: string, options?: { newEventDate?: string; copyHorses?: boolean }): Promise<Event> {
    return this.request<Event>(`/events/${eventId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  // Super Admin Testing Endpoints
  async adminResetToHorsesSubmitted(eventId: string, startingCredits?: number): Promise<any> {
    return this.request(`/admin/reset-to-horses-submitted/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ startingCredits }),
    });
  }

  async adminResetToReadyForCommentary(eventId: string, startingCredits?: number): Promise<any> {
    return this.request(`/admin/reset-to-ready-for-commentary/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ startingCredits }),
    });
  }

  async adminResetToReadyToRace(eventId: string, startingCredits?: number): Promise<any> {
    return this.request(`/admin/reset-to-ready-to-race/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ startingCredits }),
    });
  }

  async adminGetTestStatus(eventId: string): Promise<any> {
    return this.request(`/admin/test-status/${eventId}`, {
      method: 'POST',
    });
  }

  // Ticket endpoints
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    return this.request<Ticket[]>(`/tickets/event/${eventId}`);
  }

  async getUserTickets(userId: string): Promise<Ticket[]> {
    return this.request<Ticket[]>(`/tickets/user/${userId}`);
  }

  async getMyTickets(): Promise<Ticket[]> {
    return this.request<Ticket[]>('/tickets/my-tickets');
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

  // ========================================
  // NEW: PREVIOUS HORSES ENDPOINTS (v42)
  // ========================================

  /**
   * Get previous horses that can be imported to the current event
   * @param eventId - Current event ID
   * @param source - 'organiser' | 'club' | 'event'
   * @param sourceEventId - Specific event ID if source is 'event'
   */
  async getPreviousHorses(
    eventId: string,
    source?: 'organiser' | 'club' | 'event',
    sourceEventId?: string
  ): Promise<any[]> {
    let url = `/horses/previous/${eventId}`;
    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (sourceEventId) params.append('sourceEventId', sourceEventId);
    if (params.toString()) url += `?${params.toString()}`;
    
    return this.request<any[]>(url);
  }

  /**
   * Get list of events that have horses available for import
   */
  async getEventsWithHorses(eventId: string): Promise<{
    events: Array<{
      id: string;
      name: string;
      slug: string;
      eventDate: string;
      club: { id: string; name: string } | null;
      horseCount: number;
      source: 'organiser' | 'club';
    }>;
    summary: {
      totalEvents: number;
      totalHorses: number;
      organiserEvents: number;
      clubEvents: number;
    };
  }> {
    return this.request(`/horses/previous-events/${eventId}`);
  }

  /**
   * Import a horse from a previous event to the current event
   */
  async importHorse(eventId: string, sourceHorseId: string): Promise<Horse> {
    return this.request<Horse>(`/horses/import/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ sourceHorseId }),
    });
  }

  // Race endpoints
  async getEventRaces(eventId: string): Promise<Race[]> {
    return this.request<Race[]>(`/races/event/${eventId}`);
  }

  async syncRaceHorseCounts(eventId: string): Promise<{ racesUpdated: number; updates: any[] }> {
    return this.request(`/races/event/${eventId}/sync-horse-counts`, {
      method: 'POST',
    });
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

  async openBetting(raceId: string): Promise<Race> {
    return this.request<Race>(`/races/${raceId}/start-betting`, {
      method: 'PATCH',
    });
  }

  // Alias for openBetting (used by host page)
  async startBetting(raceId: string): Promise<Race> {
    return this.openBetting(raceId);
  }

  async closeBetting(raceId: string): Promise<Race> {
    return this.request<Race>(`/races/${raceId}/close-betting`, {
      method: 'PATCH',
    });
  }

  async startRace(raceId: string): Promise<Race> {
    return this.request<Race>(`/races/${raceId}/start`, {
      method: 'PATCH',
    });
  }

  async completeRace(raceId: string, winnerPosition?: number): Promise<Race> {
    return this.request<Race>(`/races/${raceId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ winnerPosition }),
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

  async getMyBets(eventId: string): Promise<Bet[]> {
    return this.request<Bet[]>(`/bets/my-bets?eventId=${eventId}`);
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
