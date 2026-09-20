export type MembershipStatus = 'active' | 'suspended' | 'exited';

export type LevyFrequency = 'one_time' | 'weekly' | 'monthly';

export type DuesInvoiceStatus = 'pending' | 'paid' | 'overdue' | 'waived';

export interface Trader {
  id: string;
  name: string;
  ownerName?: string;
  phone?: string;
  category?: string;
  photoUrl?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Market {
  id: string;
  name: string;
  location?: string;
  description?: string;
  adminUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketMembership {
  id: string;
  marketId: string;
  traderId: string;
  section?: string;
  stallNumber?: string;
  status: MembershipStatus;
  joinedAt: string;
  updatedAt: string;
  market?: Market;
  trader?: Trader;
}

export type MarketExpenseCategory =
  | 'security'
  | 'sanitation'
  | 'electricity'
  | 'administration'
  | 'maintenance'
  | 'other';

export interface MarketExpense {
  id: string;
  marketId: string;
  category: MarketExpenseCategory;
  amount: number;
  description?: string;
  createdAt: string;
}

export interface AccountingSummary {
  memberCount: number;
  dues: {
    collected: number;
    outstanding: number;
    paidCount: number;
    outstandingCount: number;
    byLevy: { levyId: string; name: string; collected: number }[];
  };
  expenses: {
    total: number;
    byCategory: { category: string; total: number }[];
  };
  balance: number;
}

export interface Levy {
  id: string;
  marketId: string;
  name: string;
  amount: number;
  frequency: LevyFrequency;
  active: boolean;
  createdAt: string;
}

export interface DuesInvoice {
  id: string;
  marketId: string;
  membershipId: string;
  levyId: string;
  period: string;
  amount: number;
  status: DuesInvoiceStatus;
  dueDate?: string;
  paidAt?: string;
  paymentNote?: string;
  createdAt: string;
  levy?: Levy;
  membership?: MarketMembership;
}

export interface Announcement {
  id: string;
  marketId: string;
  title: string;
  body: string;
  createdByUserId?: string;
  createdAt: string;
  createdBy?: { id: string; name?: string };
}
