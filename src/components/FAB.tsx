import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { addNoteToDB } from '../lib/supabaseClient';
import { days } from '../config/config';
import { findEmptySpot } from '../utils/utils';

export const FAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentDayIndex, localNotes, copiedNote, showNotification } = useAppStore();

  const addNote = async (withImage: boolean) => {
    setIsOpen(false);
    const dayName = days[currentDayIndex];
    const noteWidth = 240;
    const noteHeight = withImage ? 280 : 150;
    
    const pinnwandArea = document.querySelector('main') as HTMLElement;
    if (!pinnwandArea) return;
    
    const position = findEmptySpot(localNotes, noteWidth, noteHeight, pinnwandArea);
    
    if (!position) {
      showNotification('Die Pinnwand ist zu voll. Bitte schaffe erst Platz!', 'error');
      return;
    }

    const newNote = {
      day: dayName,
      name: 'Neuer Zettel',
      activity: '',
      x: position.x,
      y: position.y,
      width: noteWidth,
      height: noteHeight,
      closedUntil: null,
      name_fs: 16,
      activity_fs: 14,
      has_image: withImage,
      image: null,
      color: '#ffffe0',
      is_position_locked: false,
      name_font: "'Kalam', cursive",
      activity_font: "'Kalam', cursive",
      name_align: 'left',
      activity_align: 'left',
    };

    await addNoteToDB(newNote);
    showNotification('Neuer Zettel hinzugefügt!', 'success');
  };

  const pasteNote = async () => {
    setIsOpen(false);
    if (!copiedNote) {
      showNotification('Kein Zettel zum Einfügen kopiert!', 'info');
      return;
    }

    const pinnwandArea = document.querySelector('main') as HTMLElement;
    if (!pinnwandArea) return;

    const position = findEmptySpot(
      localNotes, 
      copiedNote.width, 
      copiedNote.height, 
      pinnwandArea
    );

    if (!position) {
      showNotification('Kein freier Platz zum Einfügen!', 'error');
      return;
    }

    const dayName = days[currentDayIndex];
    const newNote = {
      ...copiedNote,
      day: dayName,
      x: position.x,
      y: position.y,
    };

    await addNoteToDB(newNote);
    showNotification('Zettel eingefügt!', 'success');
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fab-backdrop active"
        />
      )}

      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            marginBottom: '16px',
            transition: 'all 0.3s',
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
        }}>
            {copiedNote && (
              <button
                onClick={pasteNote}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                  background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151',
                }}
              >
                <i className="fas fa-paste" style={{ width: '20px', color: '#22c55e' }}></i>
                <span>Zettel einfügen</span>
              </button>
            )}
            
            <button
              onClick={() => addNote(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151',
              }}
            >
              <i className="fas fa-font" style={{ width: '20px', color: '#3b82f6' }}></i>
              <span>Text-Zettel</span>
            </button>
            
            <button
              onClick={() => addNote(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
                background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#374151',
              }}
            >
              <i className="fas fa-image" style={{ width: '20px', color: '#3b82f6' }}></i>
              <span>Mit Bild</span>
            </button>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontSize: '24px',
            transition: 'all 0.3s',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          <i className={`fas fa-plus`}></i>
        </button>
      </div>
    </>
  );
};