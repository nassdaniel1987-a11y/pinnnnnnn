import { useAppStore } from '../store/appStore';
import { days } from '../config/config';
import { ThemeSelector } from './ThemeSelector';
import { WeatherWidget } from './WeatherWidget';

export const Header = () => {
  const { 
    currentDayIndex, 
    setCurrentDayIndex, 
    isEditMode, 
    setIsEditMode, 
    localNotes, 
    copiedDayNotes, 
    setCopiedDayNotes,
    showNotification // <-- Holen der Funktion aus dem Store
  } = useAppStore();

  const changeDay = (direction: number) => {
    let newIndex = currentDayIndex;
    do {
      newIndex = (newIndex + direction + 7) % 7;
    } while (days[newIndex] === 'Sonntag' || days[newIndex] === 'Samstag');
    setCurrentDayIndex(newIndex);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    showNotification(isEditMode ? 'Ansichtsmodus aktiviert.' : 'Bearbeitungsmodus aktiviert.', 'info');
  };

  const copyDay = () => {
    if (localNotes.length === 0) {
      showNotification('Keine Zettel zum Kopieren vorhanden.', 'info');
      return;
    }
    
    const notesCopy = localNotes.map(note => {
      const copy = { ...note };
      delete (copy as any).id;
      return copy;
    });
    
    setCopiedDayNotes(notesCopy as any);
    showNotification(`Tag '${days[currentDayIndex]}' mit ${localNotes.length} Zetteln kopiert.`, 'success');
  };

  const pasteDay = async () => {
    if (!copiedDayNotes || copiedDayNotes.length === 0) {
      showNotification('Kein Tag zum Einfügen kopiert!', 'info');
      return;
    }
    
    if (!window.confirm(`${copiedDayNotes.length} kopierte Zettel am '${days[currentDayIndex]}' einfügen?`)) {
      return;
    }
    
    const dayName = days[currentDayIndex];
    const notesToInsert = copiedDayNotes.map(note => ({ ...note, day: dayName }));
    
    const { copyDayNotesToDB } = await import('../lib/supabaseClient');
    const { error } = await copyDayNotesToDB(notesToInsert as any);
    
    if (error) {
      showNotification('Fehler beim Einfügen des Tages.', 'error');
    } else {
      showNotification('Tag erfolgreich eingefügt!', 'success');
    }
  };

  const arrangeNotes = async () => {
    if (localNotes.length === 0) {
      showNotification('Keine Zettel zum Anordnen vorhanden.', 'info');
      return;
    }
    
    if (!window.confirm('Wirklich alle Zettel automatisch anordnen?')) {
      return;
    }
    
    const { stripHtml } = await import('../utils/utils');
    const { updateMultipleNotesInDB } = await import('../lib/supabaseClient');
    
    const PADDING = 20;
    const pinnwandWidth = 1600;
    let currentX = PADDING;
    let currentY = PADDING;
    let rowMaxHeight = 0;
    
    const sortedNotes = [...localNotes].sort((a, b) => 
      stripHtml(a.name).localeCompare(stripHtml(b.name))
    );
    
    const updates = [];
    for (const note of sortedNotes) {
      if (currentX + note.width + PADDING > pinnwandWidth && updates.length > 0) {
        currentX = PADDING;
        currentY += rowMaxHeight + PADDING;
        rowMaxHeight = 0;
      }
      
      updates.push({ id: note.id, x: currentX, y: currentY });
      rowMaxHeight = Math.max(rowMaxHeight, note.height);
      currentX += note.width + PADDING;
    }
    
    await updateMultipleNotesInDB(updates as any);
    showNotification('Pinnwand wurde aufgeräumt!', 'success');
  };

  const openAllNotes = async () => {
    const closedNotes = localNotes.filter(note => note.closedUntil !== null);
    
    if (closedNotes.length === 0) {
      showNotification('Es sind keine Zettel geschlossen.', 'info');
      return;
    }
    
    if (!window.confirm(`Wirklich alle ${closedNotes.length} geschlossenen Zettel öffnen?`)) {
      return;
    }
    
    const { updateMultipleNotesInDB } = await import('../lib/supabaseClient');
    const updates = closedNotes.map(note => ({ id: note.id, closedUntil: null }));
    
    await updateMultipleNotesInDB(updates as any);
    showNotification('Alle Zettel wurden geöffnet!', 'success');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header style={{
      background: 'var(--header-bg)',
      color: 'var(--header-text, white)',
      boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
      position: 'relative',
      zIndex: 10,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        height: '52px'
      }}>
        {/* Left Section */}
        <div style={{ flex: 1, display: 'flex', gap: '12px', alignItems: 'center' }}>
          <WeatherWidget />
          <div id="header-clock" style={{ fontFamily: "'Courier New', monospace" }}>00:00:00</div>
        </div>
        
        {/* Center Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255,255,255,0.2)',
          padding: '8px 20px',
          borderRadius: '16px',
        }}>
          <button onClick={() => changeDay(-1)} title="Vorheriger Tag">
            <i className="fas fa-chevron-left"></i>
          </button>
          <div style={{ minWidth: '120px', textAlign: 'center', fontWeight: 600, fontSize: '18px' }}>
            {days[currentDayIndex]}
          </div>
          <button onClick={() => changeDay(1)} title="Nächster Tag">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        
        {/* Right Section */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
          <button onClick={copyDay} title="Ganzen Tag kopieren"><i className="fas fa-clone"></i></button>
          {copiedDayNotes && <button onClick={pasteDay} title="Kopierten Tag einfügen"><i className="fas fa-clipboard"></i></button>}
          {isEditMode && (
            <>
              <button onClick={openAllNotes} title="Alle Zettel öffnen"><i className="fas fa-lock-open"></i></button>
              <button onClick={arrangeNotes} title="Automatisch anordnen"><i className="fas fa-magic"></i></button>
            </>
          )}
          <ThemeSelector />
          <button onClick={toggleEditMode} title={isEditMode ? 'Bearbeitungsmodus verlassen' : 'Bearbeitungsmodus aktivieren'}>
            <i className={`fas ${isEditMode ? 'fa-eye' : 'fa-pen'}`}></i>
          </button>
          <button onClick={toggleFullscreen} title="Vollbild"><i className="fas fa-expand"></i></button>
        </div>
      </div>
      
      {isEditMode && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ef4444',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '0 0 8px 8px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 50,
        }}>
          <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
          Bearbeitungsmodus
        </div>
      )}
    </header>
  );
};