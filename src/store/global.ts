import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalState {
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      isMobile: false,
      setIsMobile: (isMobile) => set({ isMobile }),
      userId: null,
      setUserId: (userId) => set({ userId }),
    }),
    {
      name: 'hyperlift-storage',
      partialize: (state) => ({ userId: state.userId }),
    }
  )
);
