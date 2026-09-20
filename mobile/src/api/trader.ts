import { apiClient } from './client';
import { MarketMembership, Trader } from './types';

export function getMyTraderProfile() {
  return apiClient.get<Trader>('/trader/me').then((r) => r.data);
}

export function updateMyTraderProfile(payload: Partial<Pick<Trader, 'name' | 'ownerName' | 'phone' | 'category' | 'photoUrl' | 'emergencyContact'>>) {
  return apiClient.patch<Trader>('/trader/me', payload).then((r) => r.data);
}

export function getMyMarkets() {
  return apiClient.get<MarketMembership[]>('/trader/me/markets').then((r) => r.data);
}
