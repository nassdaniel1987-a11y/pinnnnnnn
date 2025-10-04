import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config/config';
import type { Note, NewNote, UpdateNote } from '../types/types';

let supabase: SupabaseClient | null = null;

export const initSupabase = () => {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabase;
};

export const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase ist nicht initialisiert');
  }
  return supabase;
};

export const loadNotesFromDB = async (dayName: string): Promise<Note[]> => {
  const client = getSupabase();
  const { data, error } = await client
    .from('zettel')
    .select('*')
    .eq('day', dayName);
  
  if (error) {
    console.error('Fehler beim Laden:', error);
    return [];
  }
  return data || [];
};

export const addNoteToDB = async (note: NewNote) => {
  const client = getSupabase();
  return await client.from('zettel').insert(note);
};

export const updateNoteInDB = async (noteId: number, updates: UpdateNote) => {
  const client = getSupabase();
  return await client.from('zettel').update(updates).eq('id', noteId);
};

export const deleteNoteFromDB = async (noteId: number) => {
  const client = getSupabase();
  return await client.from('zettel').delete().eq('id', noteId);
};

export const setupRealtimeSubscription = (
  callback: (payload: any) => void
) => {
  const client = getSupabase();
  
  const subscription = client
    .channel('zettel-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'zettel'
      },
      callback
    )
    .subscribe();
  
  return subscription;
};

export const updateMultipleNotesInDB = async (updates: Array<{ id: number } & Partial<Note>>) => {
  const client = getSupabase();
  return await client.from('zettel').upsert(updates);
};

export const copyDayNotesToDB = async (notes: NewNote[]) => {
  const client = getSupabase();
  return await client.from('zettel').insert(notes);
};