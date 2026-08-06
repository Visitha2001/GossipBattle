import { create } from "zustand";

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  handle?: string;
  handleColor?: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
