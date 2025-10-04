import { useState } from 'react';
import { updateNoteInDB } from '../lib/supabaseClient';

interface TimeLockModalProps {
  noteId: number | null;
  currentTime: string | null;
  onClose: () => void;
}

export const TimeLockModal = ({ noteId, currentTime, onClose }: TimeLockModalProps) => {
  const [timeValue, setTimeValue] = useState(
    currentTime && currentTime !== 'LOCKED' ? currentTime : ''
  );

  const handleSave = async () => {
    if (!noteId || !timeValue) return;
    
    await updateNoteInDB(noteId, { closedUntil: timeValue });
    onClose();
  };

  if (!noteId) return null;

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
          background: '#374151',
          color: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '320px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 'bold' }}>
          Sperren bis:
        </h3>
        
        <input
          type="time"
          value={timeValue}
          onChange={(e) => setTimeValue(e.target.value)}
          style={{
            width: '100%',
            marginBottom: '16px',
            background: '#1f2937',
            color: 'white',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #4b5563',
            fontSize: '16px',
          }}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
            }}
          >
            Zeit speichern
          </button>
          
          <button
            onClick={onClose}
            style={{
              padding: '12px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4b5563';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#6b7280';
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};