import { useAppStore } from '../store/appStore';
import { days } from '../config/config';
import { ThemeSelector } from './ThemeSelector';
import { WeatherWidget } from './WeatherWidget';

export const Header = () => {
  const { currentDayIndex, setCurrentDayIndex, isEditMode, setIsEditMode, localNotes, copiedDayNotes, setCopiedDayNotes } = useAppStore();

  const changeDay = (direction: number) => {
    let newIndex = currentDayIndex;
    do {
      newIndex = (newIndex + direction + 7) % 7;
    } while (days[newIndex] === 'Sonntag' || days[newIndex] === 'Samstag');
    setCurrentDayIndex(newIndex);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const copyDay = () => {
    if (localNotes.length === 0) {
      alert('Keine Zettel zum Kopieren vorhanden.');
      return;
    }
    
    const notesCopy = localNotes.map(note => {
      const copy = { ...note };
      delete (copy as any).id;
      return copy;
    });
    
    setCopiedDayNotes(notesCopy as any);
    alert(`Tag '${days[currentDayIndex]}' mit ${localNotes.length} Zetteln kopiert.`);
  };

  const pasteDay = async () => {
    if (!copiedDayNotes || copiedDayNotes.length === 0) {
      alert('Kein Tag kopiert!');
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
      alert('Fehler beim Einfügen.');
    } else {
      alert('Tag erfolgreich eingefügt!');
    }
  };

  const arrangeNotes = async () => {
    if (localNotes.length === 0) {
      alert('Keine Zettel zum Anordnen vorhanden.');
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
    alert('Pinnwand wurde aufgeräumt!');
  };

  const openAllNotes = async () => {
    const closedNotes = localNotes.filter(note => note.closedUntil !== null);
    
    if (closedNotes.length === 0) {
      alert('Es sind keine Zettel geschlossen.');
      return;
    }
    
    if (!window.confirm(`Wirklich alle ${closedNotes.length} geschlossenen Zettel öffnen?`)) {
      return;
    }
    
    const { updateMultipleNotesInDB } = await import('../lib/supabaseClient');
    const updates = closedNotes.map(note => ({ id: note.id, closedUntil: null }));
    
    await updateMultipleNotesInDB(updates as any);
    alert('Alle Zettel wurden geöffnet!');
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
      position: 'relative',
      zIndex: 10,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
      }}>
        {/* Left Section - Weather & Clock */}
        <div style={{ flex: 1, display: 'flex', gap: '12px', alignItems: 'center' }}>
          <WeatherWidget />
          
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            border: '1px solid rgba(255,255,255,0.2)',
            fontFamily: "'Courier New', monospace",
            fontWeight: 600,
            color: 'white',
          }}>
            <i className="fas fa-clock" style={{ marginRight: '6px', color: 'white' }}></i>
            <span id="header-clock">00:00:00</span>
          </div>
        </div>
        
        {/* Center Section - Day Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255,255,255,0.2)',
          padding: '8px 20px',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}>
          <button
            onClick={() => changeDay(-1)}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Vorheriger Tag"
          >
            <i className="fas fa-chevron-left" style={{ color: 'white', fontSize: '14px' }}></i>
          </button>
          
          <div style={{
            minWidth: '120px',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '18px',
            color: 'white',
          }}>
            {days[currentDayIndex]}
          </div>
          
          <button
            onClick={() => changeDay(1)}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Nächster Tag"
          >
            <i className="fas fa-chevron-right" style={{ color: 'white', fontSize: '14px' }}></i>
          </button>
        </div>
        
        {/* Right Section - Actions */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          alignItems: 'center',
        }}>
          <button
            onClick={copyDay}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
            }}
            title="Ganzen Tag kopieren"
          >
            <i className="fas fa-clone" style={{ color: 'white', fontSize: '14px' }}></i>
          </button>

          <button
            onClick={pasteDay}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
            }}
            title="Kopierten Tag einfügen"
          >
            <i className="fas fa-clipboard" style={{ color: 'white', fontSize: '14px' }}></i>
          </button>

          {isEditMode && (
            <>
              <button
                onClick={openAllNotes}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                }}
                title="Alle Zettel öffnen"
              >
                <i className="fas fa-lock-open" style={{ color: 'white', fontSize: '14px' }}></i>
              </button>

              <button
                onClick={arrangeNotes}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                }}
                title="Automatisch anordnen"
              >
                <i className="fas fa-magic" style={{ color: 'white', fontSize: '14px' }}></i>
              </button>
            </>
          )}

          <ThemeSelector />
          
          <button
            onClick={toggleEditMode}
            style={{
              padding: '8px 12px',
              background: isEditMode ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255,255,255,0.15)',
              border: isEditMode ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
            }}
            title={isEditMode ? 'Bearbeitungsmodus verlassen' : 'Bearbeitungsmodus aktivieren'}
          >
            <i className={`fas ${isEditMode ? 'fa-eye' : 'fa-pen'}`} style={{ color: 'white', fontSize: '14px' }}></i>
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
            }}
            title="Vollbild"
          >
            <i className="fas fa-expand" style={{ color: 'white', fontSize: '14px' }}></i>
          </button>
        </div>
      </div>
      
      {/* Edit Mode Badge */}
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
          whiteSpace: 'nowrap',
        }}>
          <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
          Bearbeitungsmodus
        </div>
      )}
    </header>
  );
};