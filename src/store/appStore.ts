import { create } from 'zustand';
import type { Note, ThemeName } from '../types/types';

interface AppState {
  // Daten
  localNotes: Note[];
  currentDayIndex: number;
  isEditMode: boolean;
  copiedNote: Omit<Note, 'id'> | null;
  copiedDayNotes: Note[] | null;
  currentTheme: ThemeName;
  activeEditingNote: Note | null;
  
  // Aktionen
  setLocalNotes: (notes: Note[]) => void;
  setCurrentDayIndex: (index: number) => void;
  setIsEditMode: (isEdit: boolean) => void;
  setCopiedNote: (note: Omit<Note, 'id'> | null) => void;
  setCopiedDayNotes: (notes: Note[] | null) => void;
  setCurrentTheme: (theme: ThemeName) => void;
  setActiveEditingNote: (note: Note | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initialer State
  localNotes: [],
  currentDayIndex: (() => {
    const day = new Date().getDay();
    return day === 0 || day === 6 ? 1 : day;
  })(),
  isEditMode: false,
  copiedNote: null,
  copiedDayNotes: null,
  currentTheme: (localStorage.getItem('selectedTheme') as ThemeName) || 'chalkboard',
  activeEditingNote: null,
  
  // Aktionen
  setLocalNotes: (notes) => set({ localNotes: notes }),
  setCurrentDayIndex: (index) => set({ currentDayIndex: index }),
  setIsEditMode: (isEdit) => set({ isEditMode: isEdit }),
  setCopiedNote: (note) => set({ copiedNote: note }),
  setCopiedDayNotes: (notes) => set({ copiedDayNotes: notes }),
  setCurrentTheme: (theme) => {
    localStorage.setItem('selectedTheme', theme);
    set({ currentTheme: theme });
  },
  setActiveEditingNote: (note) => set({ activeEditingNote: note }),activeEditingNote: null as any,
setActiveEditingNote: (note: any) => set({ activeEditingNote: note }),

}));