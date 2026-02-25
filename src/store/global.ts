import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalState {
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
  userRole: 'creator' | 'admin' | null;
  setUserRole: (role: 'creator' | 'admin' | null) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      isMobile: false,
      setIsMobile: (isMobile) => set({ isMobile }),
      userId: null,
      setUserId: (userId) => set({ userId }),
      userRole: null,
      setUserRole: (userRole) => set({ userRole }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'hyperlift-storage',
      partialize: (state) => ({ userId: state.userId, userRole: state.userRole }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
