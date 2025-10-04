import { useState } from 'react';
import type { Note } from '../types/types';
import { updateNoteInDB, deleteNoteFromDB } from '../lib/supabaseClient';

interface ContextMenuProps {
  note: Note;
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu = ({ note, x, y, onClose }: ContextMenuProps) => {
  const [showColorPalette, setShowColorPalette] = useState(false);

  const colors = [
    '#ffffff', '#ffffe0', '#d4edda', '#cce5ff', '#fff3cd', '#f8d7da',
    '#e9d5ff', '#cffafe', '#dcfce7', '#fef08a', '#fed7aa', '#fecdd3',
  ];

  const handleDelete = async () => {
    if (window.confirm(`Zettel "${note.name}" wirklich löschen?`)) {
      await deleteNoteFromDB(note.id);
      onClose();
    }
  };

  const handleToggleLock = async () => {
    const newStatus = note.closedUntil === 'LOCKED' ? null : 'LOCKED';
    await updateNoteInDB(note.id, { closedUntil: newStatus });
    onClose();
  };

  const handleColorChange = async (color: string) => {
    await updateNoteInDB(note.id, { color });
    onClose();
  };

  if (showColorPalette) {
    return (
      <div
        style={{
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          zIndex: 1000,
        }}
      >
        {colors.map((color) => (
          <div
            key={color}
            onClick={() => handleColorChange(color)}
            style={{
              width: '28px',
              height: '28px',
              backgroundColor: color,
              borderRadius: '6px',
              cursor: 'pointer',
              border: '2px solid #e5e7eb',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        padding: '6px',
        minWidth: '160px',
        zIndex: 1000,
      }}
    >
      <button
        onClick={() => setShowColorPalette(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          padding: '10px 12px',
          border: 'none',
          background: 'transparent',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <i className="fas fa-palette" style={{ width: '16px', color: '#3b82f6' }}></i>
        <span>Farbe ändern</span>
      </button>

      <button
        onClick={handleToggleLock}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          padding: '10px 12px',
          border: 'none',
          background: 'transparent',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <i className={`fas ${note.closedUntil === 'LOCKED' ? 'fa-lock-open' : 'fa-lock'}`} style={{ width: '16px', color: '#3b82f6' }}></i>
        <span>{note.closedUntil === 'LOCKED' ? 'Öffnen' : 'Sperren'}</span>
      </button>

      <button
        onClick={handleDelete}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          padding: '10px 12px',
          border: 'none',
          background: 'transparent',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          textAlign: 'left',
          color: '#ef4444',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <i className="fas fa-trash" style={{ width: '16px' }}></i>
        <span>Löschen</span>
      </button>
    </div>
  );
};