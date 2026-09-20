import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthTrader {
  id: string;
  name: string;
}

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  trader: AuthTrader | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setAuth: (payload: { token: string; trader: AuthTrader; user: AuthUser }) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      trader: null,
      user: null,
      hasHydrated: false,
      setAuth: (payload) => set({ token: payload.token, trader: payload.trader, user: payload.user }),
      logout: () => set({ token: null, trader: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'market-os-auth',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      partialize: (state) => ({ token: state.token, trader: state.trader, user: state.user }),
    },
  ),
);
