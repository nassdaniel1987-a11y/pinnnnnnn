import { create } from 'zustand';

interface AppState {
  currentDayIndex: number;
  setCurrentDayIndex: (index: number) => void;
  currentTheme: string;
  setCurrentTheme: (theme: string) => void;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  localNotes: any[];
  setLocalNotes: (notes: any[]) => void;
  copiedDayNotes: any[] | null;
  setCopiedDayNotes: (notes: any[] | null) => void;
  activeEditingNote: any;
  setActiveEditingNote: (note: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentDayIndex: (() => {
    const day = new Date().getDay();
    return day === 0 || day === 6 ? 1 : day;
  })(),
  setCurrentDayIndex: (index) => set({ currentDayIndex: index }),
  currentTheme: localStorage.getItem('selectedTheme') || 'chalkboard',
  setCurrentTheme: (theme) => {
    localStorage.setItem('selectedTheme', theme);
    set({ currentTheme: theme });
  },
  isEditMode: false,
  setIsEditMode: (mode) => set({ isEditMode: mode }),
  localNotes: [],
  setLocalNotes: (notes) => set({ localNotes: notes }),
  copiedDayNotes: null,
  setCopiedDayNotes: (notes) => set({ copiedDayNotes: notes }),
  activeEditingNote: null,
  setActiveEditingNote: (note) => set({ activeEditingNote: note }),
}));