import { useAppStore } from '../store/appStore';
import type { Note } from '../types/types';

export const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const stripHtml = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

export const findEmptySpot = (
  notes: Note[],
  noteWidth: number,
  noteHeight: number,
  pinnwandArea: HTMLElement
): { x: number; y: number } | null => {
  const MIN_MARGIN = 20;
  const MAX_ITERATIONS = 1000;
  let iterations = 0;
  let x = pinnwandArea.scrollLeft + 10;
  let y = pinnwandArea.scrollTop + 10;
  let startY = y;

  while (iterations++ < MAX_ITERATIONS) {
    const candidateRect = {
      left: x,
      top: y,
      right: x + noteWidth,
      bottom: y + noteHeight,
    };

    const hasOverlap = notes.some((note) => {
      const noteRect = {
        left: note.x,
        top: note.y,
        right: note.x + note.width,
        bottom: note.y + note.height,
      };

      return !(
        candidateRect.right + MIN_MARGIN < noteRect.left ||
        candidateRect.left - MIN_MARGIN > noteRect.right ||
        candidateRect.bottom + MIN_MARGIN < noteRect.top ||
        candidateRect.top - MIN_MARGIN > noteRect.bottom
      );
    });

    if (!hasOverlap) {
      return { x, y };
    }

    x += 50;
    if (x + noteWidth > pinnwandArea.scrollLeft + pinnwandArea.clientWidth) {
      x = pinnwandArea.scrollLeft + 10;
      startY += 50;
      y = startY;
    }
  }

  return null;
};

// --- NEUER CODE ---
// Diese Funktion prüft auf Kollisionen und gibt eine neue, korrigierte Position zurück.
export const resolveCollisions = (
  finalRect: { left: number; top: number; right: number; bottom: number },
  draggedNoteId: number
): { x: number; y: number } => {
  const allNotes = useAppStore.getState().localNotes;
  const PADDING = 10;
  let finalX = finalRect.left;
  let finalY = finalRect.top;
  let collision = false;

  do {
    collision = false;
    for (const note of allNotes) {
      if (note.id === draggedNoteId) continue;

      const otherRect = {
        left: note.x,
        top: note.y,
        right: note.x + note.width,
        bottom: note.y + note.height,
      };

      // Überlappungs-Check
      const overlaps = !(
        finalRect.right < otherRect.left ||
        finalRect.left > otherRect.right ||
        finalRect.bottom < otherRect.top ||
        finalRect.top > otherRect.bottom
      );

      if (overlaps) {
        collision = true;
        // Verschiebe den Zettel nach rechts neben die Kollision
        finalX = otherRect.right + PADDING;
        
        // Aktualisiere die finale Position für den nächsten Check
        finalRect.left = finalX;
        finalRect.right = finalX + (finalRect.right - (finalRect.left - (finalRect.right - finalRect.left))); // Breite beibehalten
        break; 
      }
    }
  } while (collision);

  return { x: Math.max(0, finalX), y: Math.max(0, finalY) };
};