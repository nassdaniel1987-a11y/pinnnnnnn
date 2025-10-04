import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { loadNotesFromDB, setupRealtimeSubscription } from '../lib/supabaseClient';
import { days } from '../config/config';
import { NoteCard } from './NoteCard';

export const PinnwandArea = () => {
  const { localNotes, currentDayIndex, setLocalNotes } = useAppStore();

  useEffect(() => {
    const loadNotes = async () => {
      const dayName = days[currentDayIndex];
      const notes = await loadNotesFromDB(dayName);
      setLocalNotes(notes);
    };
    loadNotes();
  }, [currentDayIndex, setLocalNotes]);

  useEffect(() => {
    const dayName = days[currentDayIndex];
    
    const subscription = setupRealtimeSubscription((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      if (eventType === 'INSERT' && newRecord.day === dayName) {
        setLocalNotes([...localNotes, newRecord]);
      } else if (eventType === 'UPDATE' && newRecord.day === dayName) {
        setLocalNotes(
          localNotes.map((note) =>
            note.id === newRecord.id ? newRecord : note
          )
        );
      } else if (eventType === 'DELETE') {
        setLocalNotes(localNotes.filter((note) => note.id !== oldRecord.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentDayIndex, localNotes, setLocalNotes]);

  return (
    <main className="flex-1 relative overflow-auto p-4 bg-green-900">
      <div className="relative min-h-full" style={{ minWidth: '2000px', minHeight: '2000px' }}>
        {localNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </main>
  );
};