import { create } from 'zustand';
import type { Note, ThemeName } from '../types/types';

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  // Daten
  localNotes: Note[];
  currentDayIndex: number;
  isEditMode: boolean;
  copiedNote: Omit<Note, 'id'> | null;
  copiedDayNotes: Note[] | null;
  currentTheme: ThemeName;
  activeEditingNote: Note | null;
  notification: NotificationState;

  // Aktionen
  setLocalNotes: (notes: Note[]) => void;
  setCurrentDayIndex: (index: number) => void;
  setIsEditMode: (isEdit: boolean) => void;
  setCopiedNote: (note: Omit<Note, 'id'> | null) => void;
  setCopiedDayNotes: (notes: Note[] | null) => void;
  setCurrentTheme: (theme: ThemeName) => void;
  setActiveEditingNote: (note: Note | null) => void;
  showNotification: (message: string, type?: NotificationState['type']) => void;
  hideNotification: () => void;
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
  notification: { message: '', type: 'info' },
  
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
  setActiveEditingNote: (note) => set({ activeEditingNote: note }),
  showNotification: (message, type = 'info') => set({ notification: { message, type } }),
  hideNotification: () => set(state => ({ notification: { ...state.notification, message: '' } })),
}));