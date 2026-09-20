import { apiClient } from './client';
import { Announcement, DuesInvoice } from './types';

export function getMyDues(marketId: string) {
  return apiClient.get<DuesInvoice[]>(`/markets/${marketId}/dues/mine`).then((r) => r.data);
}

export function payDuesInvoice(marketId: string, invoiceId: string, note?: string) {
  return apiClient.post<DuesInvoice>(`/markets/${marketId}/dues/${invoiceId}/pay`, { note }).then((r) => r.data);
}

export function getAnnouncements(marketId: string) {
  return apiClient.get<Announcement[]>(`/markets/${marketId}/announcements`).then((r) => r.data);
}
