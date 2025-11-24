// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ORGANISER' | 'HOST' | 'PLAYER';

// Auth types
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Club types
export interface Club {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  sport: string;
  county: string;
  contactEmail: string;
  contactPhone: string;
  achievements: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: ClubMember[];
  events?: Event[];
}

export interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  role: ClubMemberRole;
  joinedAt: string;
  user?: User;
}

export type ClubMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

// Event types
export interface Event {
  id: string;
  clubId: string;
  organiserId: string;
  name: string;
  description: string;
  eventDate: string;
  startTime: string;
  venue: string;
  address: string;
  ticketPrice: number;
  maxAttendees: number;
  numberOfRaces: number;
  horseDeadline: string;
  status: EventStatus;
  contentFilterMode: string;
  welcomeDrinkIncluded: boolean;
  heroImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  club?: Club;
  tickets?: Ticket[];
  horses?: Horse[];
  races?: Race[];
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

// Ticket types
export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  qrCode: string;
  status: TicketStatus;
  pricePaid: number;
  startingCredits: number;
  purchasedAt: string;
  checkedInAt?: string;
  event?: Event;
  user?: User;
}

export type TicketStatus = 'PURCHASED' | 'CHECKED_IN' | 'CANCELLED' | 'REFUNDED';

// Horse types
export interface Horse {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  ownerName: string;
  backstory: string;
  catchphrase: string;
  voiceNoteUrl: string;
  silksDescription: string;
  silksImageUrl?: string;
  approvalStatus: HorseApprovalStatus;
  approvalNotes: string;
  raceNumber: number;
  position: number;
  createdAt: string;
  event?: Event;
  user?: User;
}

export type HorseApprovalStatus = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REJECTED';

// Race types
export interface Race {
  id: string;
  eventId: string;
  raceNumber: number;
  name: string;
  description: string;
  videoId: string;
  status: RaceStatus;
  winningHorseId?: string;
  bettingOpenedAt?: string;
  bettingClosedAt?: string;
  startedAt?: string;
  completedAt?: string;
  commentaryUrl?: string;
  event?: Event;
  bets?: Bet[];
}

export type RaceStatus = 'PENDING' | 'BETTING_OPEN' | 'BETTING_CLOSED' | 'IN_PROGRESS' | 'COMPLETED';

// Bet types
export interface Bet {
  id: string;
  raceId: string;
  horseId: string;
  userId: string;
  amount: number;
  odds: number;
  potentialWinnings: number;
  status: BetStatus;
  createdAt: string;
  settledAt?: string;
  race?: Race;
  horse?: Horse;
  user?: User;
}

export type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'CANCELLED';

// Credits types
export interface CreditBalance {
  userId: string;
  eventId: string;
  balance: number;
}

export interface CreditLedger {
  id: string;
  userId: string;
  eventId: string;
  amount: number;
  type: TransactionType;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export type TransactionType = 'TICKET_PURCHASE' | 'BET_PLACED' | 'BET_WON' | 'BONUS' | 'REFUND';

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
}

export type NotificationType = 'HORSE_APPROVED' | 'HORSE_REJECTED' | 'RACE_STARTING' | 'BET_WON' | 'EVENT_REMINDER';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

// Dashboard stats
export interface DashboardStats {
  totalEvents: number;
  liveEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  upcomingEvents: Event[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'ticket_sold' | 'horse_submitted' | 'event_published' | 'race_completed';
  description: string;
  timestamp: string;
}
