import type { Note } from '../types/types';

export const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
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