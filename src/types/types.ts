export interface Note {
  id: number;
  day: string;
  name: string;
  activity: string;
  x: number;
  y: number;
  width: number;
  height: number;
  closedUntil: string | null;
  name_fs: number;
  activity_fs: number;
  has_image: boolean;
  image: string | null;
  color: string;
  is_position_locked: boolean;
  name_font: string;
  activity_font: string;
  name_align: string;
  activity_align: string;
  closeAt?: string | null;
}

export type NewNote = Omit<Note, 'id'>;
export type UpdateNote = Partial<Omit<Note, 'id'>>;

export type ThemeName = 
  | 'chalkboard'
  | 'space'
  | 'sweets'
  | 'dino'
  | 'agent'
  | 'vfb'
  | 'pokemon'
  | 'pokemon2'
  | 'pippi'
  | 'magictimals'
  | 'minecraft';

export type DayName = 
  | 'Sonntag'
  | 'Montag'
  | 'Dienstag'
  | 'Mittwoch'
  | 'Donnerstag'
  | 'Freitag'
  | 'Samstag';