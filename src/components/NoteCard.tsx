import { useState, useRef, useEffect } from 'react';
import interact from 'interactjs';
import { useAppStore } from '../store/appStore';
import { updateNoteInDB, deleteNoteFromDB } from '../lib/supabaseClient';
import { TimeLockModal } from './TimeLockModal';

interface NoteCardProps {
  note: any;
}

export const NoteCard = ({ note }: NoteCardProps) => {
  const { isEditMode } = useAppStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showTimeLockModal, setShowTimeLockModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isPermanentlyLocked = note.closedUntil === 'LOCKED';
  const isTimeLocked = note.closedUntil && !isPermanentlyLocked && currentTime < note.closedUntil;
  const isClosed = isPermanentlyLocked || isTimeLocked;

  useEffect(() => {
    const element = cardRef.current;
    if (!element || !isEditMode || note.is_position_locked) return;

    let x = 0;
    let y = 0;

    const interactable = interact(element)
      .draggable({
        listeners: {
          start: () => {
            element.classList.add('dragging');
          },
          move: (event) => {
            x += event.dx;
            y += event.dy;
            element.style.transform = `translate(${x}px, ${y}px)`;
          },
          end: async () => {
            element.classList.remove('dragging');
            const rect = element.getBoundingClientRect();
            const pinnwand = document.getElementById('pinnwand-area');
            if (pinnwand) {
              const pinnwandRect = pinnwand.getBoundingClientRect();
              const finalX = rect.left - pinnwandRect.left + pinnwand.scrollLeft;
              const finalY = rect.top - pinnwandRect.top + pinnwand.scrollTop;
              
              element.style.transform = '';
              element.style.left = `${finalX}px`;
              element.style.top = `${finalY}px`;
              
              await updateNoteInDB(note.id, { x: finalX, y: finalY });
              x = 0;
              y = 0;
            }
          },
        },
      })
      .resizable({
        edges: { bottom: true, right: true },
        listeners: {
          move: (event) => {
            Object.assign(element.style, {
              width: `${event.rect.width}px`,
              height: `${event.rect.height}px`,
            });
          },
          end: async (event) => {
            await updateNoteInDB(note.id, {
              width: event.rect.width,
              height: event.rect.height,
            });
          },
        },
      });

    return () => {
      interactable.unset();
    };
  }, [isEditMode, note.is_position_locked, note.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showMenu || showColorPalette) {
        const target = e.target as HTMLElement;
        if (!target.closest('.context-menu-enhanced') && !target.closest('.color-palette-enhanced') && !target.closest('.enhanced-menu-btn')) {
          setShowMenu(false);
          setShowColorPalette(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, showColorPalette]);

  const handleToggleLock = async () => {
    if (isClosed) {
      await updateNoteInDB(note.id, { closedUntil: null });
    } else {
      await updateNoteInDB(note.id, { closedUntil: 'LOCKED' });
    }
  };

  const handleTogglePositionLock = async () => {
    await updateNoteInDB(note.id, { is_position_locked: !note.is_position_locked });
  };

  const handleDelete = async () => {
    if (window.confirm(`Zettel "${note.name || 'Unbenannt'}" wirklich löschen?`)) {
      await deleteNoteFromDB(note.id);
    }
  };

 const handleCopy = async () => {
  try {
    // Zettel-Daten kopieren (ohne ID)
    const copiedData = {
      day: note.day,
      name: note.name,
      activity: note.activity,
      x: note.x + 20, // Leicht versetzt
      y: note.y + 20, // Leicht versetzt
      width: note.width,
      height: note.height,
      color: note.color,
      name_fs: note.name_fs,
      activity_fs: note.activity_fs,
      name_font: note.name_font,
      activity_font: note.activity_font,
      name_align: note.name_align,
      activity_align: note.activity_align,
      closedUntil: null, // Kopie ist immer offen
      closeAt: note.closeAt,
      is_position_locked: false, // Kopie ist entsperrt
      has_image: false, // Bild wird nicht kopiert
      image: null,
    };

    const { getSupabase } = await import('../lib/supabaseClient');
    const client = getSupabase();

    const { data, error } = await client
      .from('zettel')
      .insert([copiedData])
      .select();

    if (error) throw error;

    setShowMenu(false);
    alert('Zettel wurde kopiert!');
  } catch (error) {
    console.error('Fehler beim Kopieren:', error);
    alert('Fehler beim Kopieren des Zettels.');
  }
};

  const handleEdit = () => {
    const { setActiveEditingNote } = useAppStore.getState();
    setActiveEditingNote(note);
  };

  const handleChangeColor = (color: string) => {
    updateNoteInDB(note.id, { color });
    setShowColorPalette(false);
    setShowMenu(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validierung
    if (!file.type.startsWith('image/')) {
      alert('Bitte nur Bilddateien hochladen!');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Bild ist zu groß! Maximal 5MB erlaubt.');
      return;
    }

    try {
      const { getSupabase } = await import('../lib/supabaseClient');
      const client = getSupabase();

      // Einzigartigen Dateinamen generieren
      const fileExt = file.name.split('.').pop();
      const fileName = `${note.id}_${Date.now()}.${fileExt}`;

      // Altes Bild löschen falls vorhanden
      if (note.image) {
        const oldFileName = note.image.split('/').pop();
        if (oldFileName) {
          await client.storage.from('zettel_bilder').remove([oldFileName]);
        }
      }

      // Neues Bild hochladen
      const { error: uploadError } = await client.storage
        .from('zettel_bilder')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Öffentliche URL generieren
      const { data: urlData } = client.storage
        .from('zettel_bilder')
        .getPublicUrl(fileName);

      // Zettel in DB aktualisieren
      await updateNoteInDB(note.id, {
        image: urlData.publicUrl,
        has_image: true
      });

    } catch (error) {
      console.error('Fehler beim Bild-Upload:', error);
      alert('Fehler beim Hochladen des Bildes.');
    }

    // Input zurücksetzen
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm('Bild wirklich entfernen?')) return;
    
    const { getSupabase } = await import('../lib/supabaseClient');
    const client = getSupabase();
    
    if (note.image) {
      const fileName = note.image.split('/').pop();
      if (fileName) {
        await client.storage.from('zettel_bilder').remove([fileName]);
      }
    }
    
    await updateNoteInDB(note.id, { image: null, has_image: false });
  };

  const colors = [
    '#ffffff', '#ffffe0', '#d4edda', '#cce5ff', '#fff3cd', '#f8d7da',
    '#e9d5ff', '#cffafe', '#dcfce7', '#fef08a', '#fed7aa', '#fecdd3',
    '#e5e7eb', '#bfdbfe', '#fca5a5', '#d9f99d', '#f87171', '#fbbf24',
    '#a3e635', '#4ade80', '#38bdf8', '#818cf8', '#c084fc', '#f472b6'
  ];

  return (
    <>
      <div
        ref={cardRef}
        className="room-card"
        data-note-id={note.id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          left: `${note.x}px`,
          top: `${note.y}px`,
          width: `${note.width}px`,
          height: note.height ? `${note.height}px` : 'auto',
          backgroundColor: note.color || '#ffffe0',
          borderRadius: '4px',
          padding: '16px',
          paddingTop: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid rgba(0,0,0,0.15)',
          boxShadow: isHovered 
            ? '0 8px 16px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)' 
            : '0 4px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
          cursor: isEditMode && !note.is_position_locked ? 'move' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          overflow: 'visible',
        }}
      >
        {/* Drag Indicator */}
        {isEditMode && !note.is_position_locked && (
          <div style={{
            position: 'absolute',
            top: '4px',
            left: '8px',
            right: '8px',
            height: '4px',
            background: isHovered 
              ? 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.6) 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)',
            borderRadius: '2px',
            opacity: isHovered ? 1 : 0.5,
            transition: 'all 0.3s ease',
          }} />
        )}

        {/* Enhanced Pin */}
        <div
          onClick={isEditMode ? handleTogglePositionLock : undefined}
          style={{
            position: 'absolute',
            top: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            zIndex: 15,
            cursor: isEditMode ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            background: note.is_position_locked 
              ? 'linear-gradient(145deg, #ef4444, #dc2626)' 
              : 'linear-gradient(145deg, #22c55e, #16a34a)',
            boxShadow: note.is_position_locked
              ? '0 2px 8px rgba(239, 68, 68, 0.4), inset 0 1px 2px rgba(255,255,255,0.5)'
              : '0 2px 8px rgba(34, 197, 94, 0.4), inset 0 1px 2px rgba(255,255,255,0.5)',
            border: '2px solid rgba(255,255,255,0.9)',
          }}
          title={note.is_position_locked ? 'Position entsperren' : 'Position sperren'}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }} />
        </div>

        {/* Status Indicator */}
        <button
          onClick={handleToggleLock}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            height: '22px',
            borderRadius: '11px',
            zIndex: 10,
            transition: 'all 0.3s ease',
            border: 'none',
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            background: isClosed 
              ? (isPermanentlyLocked ? '#ef4444' : '#f59e0b')
              : '#22c55e',
            boxShadow: `0 2px 4px ${isClosed 
              ? (isPermanentlyLocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)')
              : 'rgba(34, 197, 94, 0.4)'}`,
          }}
          title={isClosed ? 'Zettel öffnen' : 'Zettel schließen'}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <i className={`fas ${isClosed ? 'fa-lock' : 'fa-lock-open'}`} style={{ fontSize: '10px' }}></i>
          <span>{isClosed ? 'Gesperrt' : 'Offen'}</span>
        </button>

        {/* Menu Button */}
        <button
          onClick={() => {
            setShowMenu(!showMenu);
            setShowColorPalette(false);
          }}
          style={{
            position: 'absolute',
            top: '36px',
            right: '8px',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(107, 114, 128, 0.15)',
            border: 'none',
            color: '#4b5563',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isHovered || showMenu ? 1 : 0,
            transform: isHovered || showMenu ? 'scale(1)' : 'scale(0.8)',
            zIndex: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
          title="Menü"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(107, 114, 128, 0.25)';
            e.currentTarget.style.color = '#1f2937';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(107, 114, 128, 0.15)';
            e.currentTarget.style.color = '#4b5563';
          }}
        >
          <i className="fas fa-ellipsis-v"></i>
        </button>

        {/* Context Menu */}
        {showMenu && (
          <div
            className="context-menu-enhanced"
            style={{
              position: 'absolute',
              top: '36px',
              right: '8px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              border: '1px solid #e5e7eb',
              padding: '6px',
              zIndex: 30,
              minWidth: '180px',
              animation: 'contextMenuAppear 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          >
            <MenuItem icon="fa-pen-to-square" text="Bearbeiten" onClick={handleEdit} />
            <MenuItem icon="fa-copy" text="Kopieren" onClick={handleCopy} />
            <MenuItem 
              icon="fa-palette" 
              text="Farbe ändern" 
              onClick={() => {
                setShowColorPalette(!showColorPalette);
                setShowMenu(false);
              }} 
            />
            {isClosed ? (
              <MenuItem icon="fa-lock-open" text="Zettel öffnen" onClick={handleToggleLock} />
            ) : (
              <>
                <MenuItem icon="fa-lock" text="Zettel sperren" onClick={handleToggleLock} />
                <MenuItem 
                  icon="fa-clock" 
                  text="Zeitsperre setzen" 
                  onClick={() => {
                    setShowTimeLockModal(true);
                    setShowMenu(false);
                  }} 
                />
              </>
            )}
            <MenuItem icon="fa-trash" text="Löschen" onClick={handleDelete} danger />
          </div>
        )}

        {/* Color Palette */}
        {showColorPalette && (
          <div
            className="color-palette-enhanced"
            style={{
              position: 'absolute',
              top: '36px',
              right: '8px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              border: '1px solid #e5e7eb',
              padding: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              zIndex: 25,
              animation: 'contextMenuAppear 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          >
            {colors.map(color => (
              <div
                key={color}
                onClick={() => handleChangeColor(color)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  transition: 'all 0.2s ease',
                  backgroundColor: color,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                  e.currentTarget.style.borderColor = '#374151';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              />
            ))}
          </div>
        )}

        {/* Card Content */}
        <div style={{ 
          fontSize: `${note.name_fs || 16}px`, 
          fontFamily: note.name_font || "'Kalam', cursive",
          textAlign: note.name_align || 'left',
          fontWeight: 600, 
          color: '#1f2937',
          lineHeight: '1.3',
          wordWrap: 'break-word',
        }}>
          {note.name || 'Neuer Zettel'}
        </div>
        
        <div style={{ 
          fontSize: `${note.activity_fs || 14}px`,
          fontFamily: note.activity_font || "'Kalam', cursive",
          textAlign: note.activity_align || 'left',
          color: '#4b5563',
          lineHeight: '1.4',
          wordWrap: 'break-word',
        }}>
          {note.activity || ''}
        </div>

        {/* Image Area */}
        {note.has_image && (
          <div style={{ 
            flex: 1, 
            borderRadius: '8px', 
            overflow: 'hidden', 
            minHeight: '120px',
            position: 'relative',
            background: note.image ? 'transparent' : '#f3f4f6',
            border: note.image ? 'none' : '2px dashed #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {note.image ? (
              <>
                <img 
                  src={note.image} 
                  alt="Zettel Bild" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                {isEditMode && !isClosed && (
                  <button
                    onClick={handleRemoveImage}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Bild entfernen"
                  >
                    <i className="fas fa-times" style={{ fontSize: '14px' }}></i>
                  </button>
                )}
              </>
            ) : (
              isEditMode && !isClosed && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '20px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#3b82f6';
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <i className="fas fa-image" style={{ fontSize: '32px' }}></i>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Bild hinzufügen</span>
                  </button>
                </>
              )
            )}
          </div>
        )}

        {/* Closed Overlay */}
        {isClosed && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-8deg)',
              background: 'rgba(255, 255, 255, 0.97)',
              border: `3px solid ${isPermanentlyLocked ? '#ef4444' : '#f59e0b'}`,
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '15px',
              fontWeight: 700,
              color: isPermanentlyLocked ? '#ef4444' : '#f59e0b',
              textAlign: 'center',
              zIndex: 20,
              boxShadow: isPermanentlyLocked 
                ? '0 6px 16px rgba(239, 68, 68, 0.3)'
                : '0 6px 16px rgba(245, 158, 11, 0.3)',
              backdropFilter: 'blur(8px)',
              minWidth: '75%',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <i className={`fas ${isPermanentlyLocked ? 'fa-lock' : 'fa-hourglass-half'}`} style={{ marginRight: '8px' }}></i>
            {isPermanentlyLocked ? 'Geschlossen' : `Öffnet um ${note.closedUntil}`}
          </div>
        )}

        {/* Resize Handle */}
        {isEditMode && (
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              right: '-8px',
              width: '20px',
              height: '20px',
              cursor: 'se-resize',
              opacity: isHovered ? 0.8 : 0,
              zIndex: 12,
              transition: 'all 0.3s ease',
              background: '#3b82f6',
              borderRadius: '50% 0 50% 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)',
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              background: 'white',
              borderRadius: '50%',
            }} />
          </div>
        )}
      </div>

      {/* Time Lock Modal */}
      {showTimeLockModal && (
        <TimeLockModal
          noteId={note.id}
          currentTime={note.closedUntil}
          onClose={() => setShowTimeLockModal(false)}
        />
      )}

      <style>{`
        @keyframes contextMenuAppear {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .room-card.dragging {
          transition: none !important;
          transform: translateY(-4px) rotate(2deg) !important;
          box-shadow: 0 12px 24px rgba(0,0,0,0.3) !important;
          z-index: 9999 !important;
          cursor: grabbing !important;
        }
      `}</style>
    </>
  );
};

// MenuItem Component
interface MenuItemProps {
  icon: string;
  text: string;
  onClick: () => void;
  danger?: boolean;
}

const MenuItem = ({ icon, text, onClick, danger }: MenuItemProps) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '14px',
      color: '#374151',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = danger ? '#fef2f2' : '#f8fafc';
      e.currentTarget.style.color = danger ? '#ef4444' : '#3b82f6';
      e.currentTarget.style.transform = 'translateX(2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = '#374151';
      e.currentTarget.style.transform = 'translateX(0)';
    }}
  >
    <i className={`fas ${icon}`} style={{ width: '16px', textAlign: 'center', opacity: 0.7 }}></i>
    <span>{text}</span>
  </div>
);