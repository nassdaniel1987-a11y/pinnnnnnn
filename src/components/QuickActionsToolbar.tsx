import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { days } from '../config/config';
import { SchedulerModal } from './SchedulerModal';

export const QuickActionsToolbar = () => {
  const { 
    isEditMode, 
    setIsEditMode, 
    localNotes, 
    currentDayIndex, 
    copiedDayNotes, 
    setCopiedDayNotes,
    showNotification // Notification-Funktion aus dem Store holen
  } = useAppStore();
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);

  const handleEditMode = () => {
    setIsEditMode(!isEditMode);
    showNotification(isEditMode ? 'Ansichtsmodus aktiviert' : 'Bearbeitungsmodus aktiviert', 'info');
  };

  const handleOpenAll = async () => {
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

  const handleArrange = async () => {
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
    const pinnwandWidth = 1600; // Annahme einer Standardbreite
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

  const handleLockAll = async () => {
    const openNotes = localNotes.filter(note => note.closedUntil === null);
    
    if (openNotes.length === 0) {
      showNotification('Alle Zettel sind bereits gesperrt.', 'info');
      return;
    }
    
    if (!window.confirm(`Wirklich alle ${openNotes.length} offenen Zettel sperren?`)) {
      return;
    }
    
    const { updateMultipleNotesInDB } = await import('../lib/supabaseClient');
    const updates = openNotes.map(note => ({ id: note.id, closedUntil: 'LOCKED' }));
    
    await updateMultipleNotesInDB(updates as any);
    showNotification('Alle Zettel wurden gesperrt!', 'success');
  };

  const handleCopyDay = () => {
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

  const handlePasteDay = async () => {
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

  const handleZoomFit = () => {
    if (localNotes.length === 0) {
      showNotification('Keine Zettel zum Anzeigen vorhanden.', 'info');
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    localNotes.forEach(note => {
      minX = Math.min(minX, note.x);
      minY = Math.min(minY, note.y);
      maxX = Math.max(maxX, note.x + note.width);
      maxY = Math.max(maxY, note.y + note.height);
    });
    
    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const pinnwandArea = document.getElementById('pinnwand-area');
    if (pinnwandArea) {
      const viewportWidth = pinnwandArea.clientWidth;
      const viewportHeight = pinnwandArea.clientHeight;
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      const scrollX = minX - (viewportWidth - contentWidth) / 2;
      const scrollY = minY - (viewportHeight - contentHeight) / 2;
      
      pinnwandArea.scrollTo({
        left: Math.max(0, scrollX),
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });
    }
  };

  const handleCenterView = () => {
    const pinnwandArea = document.getElementById('pinnwand-area');
    if (!pinnwandArea) return;

    if (localNotes.length === 0) {
      pinnwandArea.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    } else {
      let avgX = 0, avgY = 0;
      localNotes.forEach(note => {
        avgX += note.x + note.width / 2;
        avgY += note.y + note.height / 2;
      });
      avgX /= localNotes.length;
      avgY /= localNotes.length;
      
      const scrollX = avgX - pinnwandArea.clientWidth / 2;
      const scrollY = avgY - pinnwandArea.clientHeight / 2;
      
      pinnwandArea.scrollTo({
        left: Math.max(0, scrollX),
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });
    }
  };

  const handleScheduler = () => {
    setShowSchedulerModal(true);
  };

  const handleClearDay = async () => {
    if (localNotes.length === 0) {
      showNotification('Der Tag ist bereits leer.', 'info');
      return;
    }

    const dayName = days[currentDayIndex];
    const noteCount = localNotes.length;
    
    if (!window.confirm(
      `Möchtest du wirklich alle ${noteCount} Zettel von '${dayName}' dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden!`
    )) {
      return;
    }
    
    const { getSupabase } = await import('../lib/supabaseClient');
    const client = getSupabase();
    
    try {
      const notesWithImages = localNotes.filter(note => note.image);
      for (const note of notesWithImages) {
        if (note.image) {
          const fileName = note.image.split('/').pop();
          if (fileName) {
            await client.storage.from('zettel_bilder').remove([fileName]);
          }
        }
      }
      
      const { error } = await client.from('zettel').delete().eq('day', dayName);
      if (error) throw error;
      
      showNotification(`Alle ${noteCount} Zettel von '${dayName}' wurden gelöscht!`, 'success');
    } catch (error) {
      console.error('Fehler beim Löschen des Tages:', error);
      showNotification('Ein Fehler ist beim Löschen aufgetreten.', 'error');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: isEditMode ? '16px' : '-80px',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 100,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '16px 0',
      }}
    >
      <QuickActionButton
        icon={isEditMode ? 'fa-eye' : 'fa-pen'}
        title={isEditMode ? 'Ansichtsmodus' : 'Bearbeitungsmodus'}
        onClick={handleEditMode}
        variant="edit-mode"
        active={isEditMode}
      />
      <Divider />
      <QuickActionButton icon="fa-lock-open" title="Alle Zettel öffnen" onClick={handleOpenAll} variant="success" />
      <QuickActionButton icon="fa-magic" title="Automatisch anordnen" onClick={handleArrange} variant="info" />
      <QuickActionButton icon="fa-lock" title="Alle Zettel sperren" onClick={handleLockAll} variant="warning" />
      <Divider />
      <QuickActionButton icon="fa-clone" title="Tag kopieren" onClick={handleCopyDay} />
      <QuickActionButton icon="fa-clipboard" title="Tag einfügen" onClick={handlePasteDay} />
      <Divider />
      <QuickActionButton icon="fa-compress-arrows-alt" title="Alles anzeigen" onClick={handleZoomFit} />
      <QuickActionButton icon="fa-crosshairs" title="Ansicht zentrieren" onClick={handleCenterView} />
      <QuickActionButton icon="fa-calendar-alt" title="Zettel-Planer" onClick={handleScheduler} variant="info" />
      <Divider />
      <QuickActionButton icon="fa-trash-alt" title="Tag leeren" onClick={handleClearDay} variant="danger" />
      <SchedulerModal isOpen={showSchedulerModal} onClose={() => setShowSchedulerModal(false)} />
    </div>
  );
};

// Helper Components
interface QuickActionButtonProps {
  icon: string;
  title: string;
  onClick: () => void;
  variant?: 'edit-mode' | 'success' | 'info' | 'warning' | 'danger';
  active?: boolean;
}

const QuickActionButton = ({ icon, title, onClick, variant, active }: QuickActionButtonProps) => {
  const getVariantStyle = () => {
    if (variant === 'edit-mode') {
      return {
        background: active ? 'linear-gradient(135deg, #10b981, #059669)' : 'white',
        color: active ? 'white' : '#6b7280',
        boxShadow: active ? '0 0 0 2px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(0,0,0,0.15)',
      };
    }
    return {};
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          background: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          color: '#6b7280',
          fontSize: '18px',
          position: 'relative',
          overflow: 'hidden',
          ...getVariantStyle(),
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(4px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
          
          if (!variant || (variant === 'edit-mode' && !active)) {
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.background = '#3b82f6';
          } else if (variant === 'success') {
            e.currentTarget.style.background = '#22c55e';
            e.currentTarget.style.color = 'white';
          } else if (variant === 'info') {
            e.currentTarget.style.background = '#3b82f6';
            e.currentTarget.style.color = 'white';
          } else if (variant === 'warning') {
            e.currentTarget.style.background = '#f59e0b';
            e.currentTarget.style.color = 'white';
          } else if (variant === 'danger') {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = 'white';
          }
          
          const tooltip = e.currentTarget.querySelector('.tooltip') as HTMLElement;
          if (tooltip) {
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
            tooltip.style.left = '68px';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0) scale(1)';
          
          if (variant === 'edit-mode') {
            const styles = getVariantStyle();
            e.currentTarget.style.boxShadow = styles.boxShadow || '0 4px 12px rgba(0,0,0,0.15)';
            e.currentTarget.style.background = styles.background;
            e.currentTarget.style.color = styles.color;
          } else {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#6b7280';
          }
          
          const tooltip = e.currentTarget.querySelector('.tooltip') as HTMLElement;
          if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.left = '64px';
          }
        }}
      >
        <i className={`fas ${icon}`}></i>
        
        <div
          className="tooltip"
          style={{
            position: 'absolute',
            left: '64px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.3s ease',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          {title}
          <div
            style={{
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              border: '5px solid transparent',
              borderRightColor: 'rgba(0, 0, 0, 0.8)',
            }}
          />
        </div>
      </button>
    </div>
  );
};

const Divider = () => (
  <div
    style={{
      width: '32px',
      height: '1px',
      background: 'linear-gradient(90deg, transparent, #d1d5db, transparent)',
      margin: '8px auto',
    }}
  />
);