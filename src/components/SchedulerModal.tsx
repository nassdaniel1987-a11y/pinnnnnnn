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
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(248, 250, 252, 0.98)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
          color: '#1f2937',
          borderRadius: '16px',
          padding: '28px',
          width: '90%',
          maxWidth: '1000px',
          maxHeight: '85vh',
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
          paddingBottom: '16px',
          borderBottom: '2px solid rgba(0,0,0,0.1)',
        }}>
          <h3 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: 0,
          }}>
            <i className="fas fa-calendar-alt" style={{ color: '#3b82f6', fontSize: '20px' }}></i>
            <span>Zettel-Planer für '{days[currentDayIndex]}'</span>
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(107, 114, 128, 0.1)',
              border: 'none',
              color: '#6b7280',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '22px',
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

        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 140px 60px',
          gap: '16px',
          padding: '12px 16px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderRadius: '8px',
          marginBottom: '12px',
          fontWeight: 600,
          fontSize: '13px',
          color: '#4b5563',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          <div>Zettel</div>
          <div style={{ textAlign: 'center' }}>
            <i className="fas fa-door-open" style={{ marginRight: '6px', color: '#22c55e' }}></i>
            Öffnet um
          </div>
          <div style={{ textAlign: 'center' }}>
            <i className="fas fa-door-closed" style={{ marginRight: '6px', color: '#ef4444' }}></i>
            Schließt um
          </div>
          <div style={{ textAlign: 'center' }}>Sperre</div>
        </div>

        {/* List */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          paddingRight: '8px',
        }}>
          {sortedNotes.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#9ca3af', 
              padding: '48px 32px',
              fontSize: '15px',
            }}>
              <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3, display: 'block' }}></i>
              Für diesen Tag gibt es keine Zettel.
            </div>
          ) : (
            sortedNotes.map((note, index) => {
              const isLocked = note.closedUntil === 'LOCKED';
              const openTimeValue = (note.closedUntil && !isLocked) ? note.closedUntil : '';
              const closeTimeValue = note.closeAt || '';

              return (
                <div
                  key={note.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 140px 140px 60px',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: index < sortedNotes.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                    transition: 'background 0.2s',
                    borderRadius: '6px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Title */}
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#1f2937',
                    }}
                    title={stripHtml(note.name)}
                  >
                    {stripHtml(note.name) || 'Unbenannter Zettel'}
                  </div>

                  {/* Open Time */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <input
                      type="time"
                      value={openTimeValue}
                      onChange={(e) => handleOpenTimeChange(note.id, e.target.value)}
                      disabled={isLocked}
                      style={{
                        width: '110px',
                        background: isLocked ? '#f3f4f6' : '#ffffff',
                        border: '1px solid #d1d5db',
                        color: isLocked ? '#9ca3af' : '#1f2937',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '13px',
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => {
                        if (!isLocked) {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Close Time */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <input
                      type="time"
                      value={closeTimeValue}
                      onChange={(e) => handleCloseTimeChange(note.id, e.target.value)}
                      style={{
                        width: '110px',
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        color: '#1f2937',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Lock Button */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleToggleLock(note)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
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
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
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
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '2px solid rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <i className="fas fa-info-circle" style={{ color: '#3b82f6', fontSize: '14px' }}></i>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: 0,
          }}>
            Änderungen werden automatisch gespeichert
          </p>
        </div>
      </div>
    </div>
  );
};