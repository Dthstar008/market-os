import { apiClient } from './client';
import {
  Announcement,
  DuesInvoice,
  Levy,
  LevyFrequency,
  Market,
  MarketExpense,
  MarketExpenseCategory,
  MarketMembership,
  AccountingSummary,
} from './types';

export function createMarket(payload: { name: string; location?: string; description?: string }) {
  return apiClient.post<Market & { adminInviteCode: string }>('/markets', payload).then((r) => r.data);
}

export function joinMarketAsAdmin(code: string) {
  return apiClient.post<Market>('/markets/join-as-admin', { code }).then((r) => r.data);
}

export function getMyAdminMarkets() {
  return apiClient.get<Market[]>('/markets/mine').then((r) => r.data);
}

/** Sub-screens are pushed with a marketId param from the admin home screen's market switcher; falls back to the first administered market when navigated to directly. */
export async function resolveAdminMarketId(paramMarketId?: string): Promise<string | null> {
  if (paramMarketId) return paramMarketId;
  const markets = await getMyAdminMarkets();
  return markets[0]?.id ?? null;
}

export function getInviteCode(marketId: string) {
  return apiClient.get<{ code: string }>(`/markets/${marketId}/invite-code`).then((r) => r.data.code);
}

export function lookupTraderByEmail(email: string) {
  return apiClient.get<{ traderId: string; name: string }>('/trader/lookup', { params: { email } }).then((r) => r.data);
}

export function listMembers(marketId: string) {
  return apiClient.get<MarketMembership[]>(`/markets/${marketId}/members`).then((r) => r.data);
}

export function addMember(marketId: string, payload: { traderId: string; section?: string; stallNumber?: string }) {
  return apiClient.post<MarketMembership>(`/markets/${marketId}/members`, payload).then((r) => r.data);
}

export function listLevies(marketId: string) {
  return apiClient.get<Levy[]>(`/markets/${marketId}/levies`).then((r) => r.data);
}

export function createLevy(marketId: string, payload: { name: string; amount: number; frequency: LevyFrequency }) {
  return apiClient.post<Levy>(`/markets/${marketId}/levies`, payload).then((r) => r.data);
}

export function setLevyActive(marketId: string, levyId: string, active: boolean) {
  return apiClient.patch<Levy>(`/markets/${marketId}/levies/${levyId}`, { active }).then((r) => r.data);
}

export function generateDues(marketId: string, payload: { levyId: string; period: string }) {
  return apiClient
    .post<{ created: number; skipped: number }>(`/markets/${marketId}/dues/generate`, payload)
    .then((r) => r.data);
}

export function listAllDues(marketId: string) {
  return apiClient.get<DuesInvoice[]>(`/markets/${marketId}/dues`).then((r) => r.data);
}

export function listExpenses(marketId: string) {
  return apiClient.get<MarketExpense[]>(`/markets/${marketId}/expenses`).then((r) => r.data);
}

export function createExpense(marketId: string, payload: { category: MarketExpenseCategory; amount: number; description?: string }) {
  return apiClient.post<MarketExpense>(`/markets/${marketId}/expenses`, payload).then((r) => r.data);
}

export function createAnnouncement(marketId: string, payload: { title: string; body: string }) {
  return apiClient.post<Announcement>(`/markets/${marketId}/announcements`, payload).then((r) => r.data);
}

export function getAccountingSummary(marketId: string) {
  return apiClient.get<AccountingSummary>(`/markets/${marketId}/accounting/summary`).then((r) => r.data);
}
