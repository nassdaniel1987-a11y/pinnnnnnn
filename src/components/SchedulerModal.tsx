import { useAppStore } from '../store/appStore';
import { days } from '../config/config';
import { updateNoteInDB } from '../lib/supabaseClient';
import { stripHtml } from '../utils/utils';

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchedulerModal = ({ isOpen, onClose }: SchedulerModalProps) => {
  const { localNotes, currentDayIndex } = useAppStore();

  if (!isOpen) return null;

  const sortedNotes = [...localNotes].sort((a, b) => 
    stripHtml(a.name).localeCompare(stripHtml(b.name))
  );

  const handleOpenTimeChange = async (noteId: number, newTime: string) => {
    await updateNoteInDB(noteId, { closedUntil: newTime || null });
  };

  const handleCloseTimeChange = async (noteId: number, newTime: string) => {
    await updateNoteInDB(noteId, { closeAt: newTime || null });
  };

  const handleToggleLock = async (note: any) => {
    const isLocked = note.closedUntil === 'LOCKED';
    if (isLocked) {
      await updateNoteInDB(note.id, { closedUntil: null });
    } else {
      await updateNoteInDB(note.id, { closedUntil: 'LOCKED' });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
          color: '#1f2937',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: 0,
          }}>
            <i className="fas fa-calendar-alt" style={{ color: '#3b82f6' }}></i>
            <span>Zettel-Planer für '{days[currentDayIndex]}'</span>
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(107, 114, 128, 0.1)',
              border: 'none',
              color: '#6b7280',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            ×
          </button>
        </div>

        {/* List */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          paddingRight: '8px',
        }}>
          {sortedNotes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
              Für diesen Tag gibt es keine Zettel.
            </p>
          ) : (
            sortedNotes.map((note, index) => {
              const isLocked = note.closedUntil === 'LOCKED';
              const openTimeValue = (note.closedUntil && !isLocked) ? note.closedUntil : '';
              const closeTimeValue = note.closeAt || '';

              return (
                <div
                  key={note.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '12px 8px',
                    borderBottom: index < sortedNotes.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Title */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={stripHtml(note.name)}
                  >
                    {stripHtml(note.name) || 'Unbenannter Zettel'}
                  </span>

                  {/* Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexShrink: 0,
                  }}>
                    {/* Open Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-door-open" style={{ color: '#22c55e', fontSize: '14px' }} title="Öffnet um"></i>
                      <input
                        type="time"
                        value={openTimeValue}
                        onChange={(e) => handleOpenTimeChange(note.id, e.target.value)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d1d5db',
                          color: '#1f2937',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '13px',
                          width: '100px',
                        }}
                      />
                    </div>

                    {/* Close Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-door-closed" style={{ color: '#ef4444', fontSize: '14px' }} title="Schließt um"></i>
                      <input
                        type="time"
                        value={closeTimeValue}
                        onChange={(e) => handleCloseTimeChange(note.id, e.target.value)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #d1d5db',
                          color: '#1f2937',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '13px',
                          width: '100px',
                        }}
                      />
                    </div>

                    {/* Lock Button */}
                    <button
                      onClick={() => handleToggleLock(note)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        background: isLocked ? '#ef4444' : '#6b7280',
                        color: 'white',
                      }}
                      title={isLocked ? 'Zettel entsperren' : 'Dauerhaft sperren'}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <i className={`fas ${isLocked ? 'fa-lock' : 'fa-lock-open'}`} style={{ fontSize: '14px' }}></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
          marginTop: '16px',
          marginBottom: 0,
        }}>
          Änderungen werden sofort gespeichert.
        </p>
      </div>
    </div>
  );
};