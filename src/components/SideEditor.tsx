import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { updateNoteInDB } from '../lib/supabaseClient';
import type { Note } from '../types/types';

// Hilfsfunktion, um Formatierungen auf eine Auswahl anzuwenden
const applyStyle = (style: string, value: string) => {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(style, false, value);
};

export const SideEditor = () => {
  const { activeEditingNote, setActiveEditingNote } = useAppStore();
  
  // Refs für die bearbeitbaren Divs
  const nameDivRef = useRef<HTMLDivElement>(null);
  const activityDivRef = useRef<HTMLDivElement>(null);

  // Lokaler State für die Bearbeitung
  const [nameContent, setNameContent] = useState('');
  const [activityContent, setActivityContent] = useState('');
  const [nameFontSize, setNameFontSize] = useState(16);
  const [activityFontSize, setActivityFontSize] = useState(14);
  const [nameFont, setNameFont] = useState("'Kalam', cursive");
  const [activityFont, setActivityFont] = useState("'Kalam', cursive");
  const [nameAlign, setNameAlign] = useState('left');
  const [activityAlign, setActivityAlign] = useState('left');

  // Wenn ein Zettel zum Bearbeiten ausgewählt wird, fülle den State
  useEffect(() => {
    if (activeEditingNote) {
      setNameContent(activeEditingNote.name || '');
      setActivityContent(activeEditingNote.activity || '');
      setNameFontSize(activeEditingNote.name_fs || 16);
      setActivityFontSize(activeEditingNote.activity_fs || 14);
      setNameFont(activeEditingNote.name_font || "'Kalam', cursive");
      setActivityFont(activeEditingNote.activity_font || "'Kalam', cursive");
      setNameAlign(activeEditingNote.name_align || 'left');
      setActivityAlign(activeEditingNote.activity_align || 'left');
    }
  }, [activeEditingNote]);

  // Funktion zum Speichern und Schließen
  const handleCloseAndSave = async () => {
    if (activeEditingNote && nameDivRef.current && activityDivRef.current) {
      await updateNoteInDB(activeEditingNote.id, {
        name: nameDivRef.current.innerHTML,
        activity: activityDivRef.current.innerHTML,
        name_fs: nameFontSize,
        activity_fs: activityFontSize,
        name_font: nameFont,
        activity_font: activityFont,
        name_align: nameAlign,
        activity_align: activityAlign,
      });
    }
    setActiveEditingNote(null);
  };

  if (!activeEditingNote) return null;

  const fonts = [
    { value: "'Kalam', cursive", label: 'Kalam' },
    { value: "'Roboto', sans-serif", label: 'Roboto' },
    { value: "'Poppins', sans-serif", label: 'Poppins' },
    { value: "'Playfair Display', serif", label: 'Playfair Display' },
    { value: "'Special Elite', monospace", label: 'Special Elite' },
    { value: "'Source Code Pro', monospace", label: 'Source Code' },
    { value: "'Caveat', cursive", label: 'Caveat' },
    { value: "'Pacifico', cursive", label: 'Pacifico' },
    { value: "'Lobster', cursive", label: 'Lobster' },
  ];
  
  // Dummy-Note für die Vorschau mit den aktuellen Werten
  const previewNote: Note = {
      ...activeEditingNote,
      name: nameContent,
      activity: activityContent,
      name_fs: nameFontSize,
      activity_fs: activityFontSize,
      name_font: nameFont,
      activity_font: activityFont,
      name_align: nameAlign,
      activity_align: activityAlign
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        height: '100%',
        background: '#2d3748',
        color: '#e2e8f0',
        boxShadow: '-10px 0 25px rgba(0,0,0,0.5)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(0,0,0,0.2)',
        borderBottom: '1px solid #4a5568',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Zettel bearbeiten</h3>
          <button
            onClick={handleCloseAndSave}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Preview */}
        <div style={{
          background: 'rgba(0,0,0,0.15)',
          borderRadius: '8px',
          border: '1px solid #4a5568',
          padding: '16px',
          minHeight: '120px',
        }}>
           <div style={{
              background: previewNote.color || '#ffffe0',
              padding: '16px',
              borderRadius: '4px',
              color: '#1f2937',
           }}>
              <div
                style={{
                    fontSize: `${previewNote.name_fs}px`,
                    fontFamily: previewNote.name_font,
                    textAlign: previewNote.name_align as any,
                    fontWeight: 600,
                    marginBottom: '8px',
                    wordWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: previewNote.name }}
              />
              <div
                style={{
                    fontSize: `${previewNote.activity_fs}px`,
                    fontFamily: previewNote.activity_font,
                    textAlign: previewNote.activity_align as any,
                    wordWrap: 'break-word',
                    color: '#4b5563'
                }}
                dangerouslySetInnerHTML={{ __html: previewNote.activity }}
              />
           </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '20px',
        overflowY: 'auto',
        flex: 1,
      }}>
        {/* Titel Sektion */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#a0aec0' }}>
            Titel
          </label>
          <div
            ref={nameDivRef}
            contentEditable
            onInput={(e) => setNameContent(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: nameContent }}
            style={{
              width: '100%',
              background: '#1a202c',
              border: '1px solid #4a5568',
              borderRadius: '6px',
              padding: '12px',
              color: '#e2e8f0',
              fontSize: '14px',
              minHeight: '40px',
            }}
          />
        </div>

        {/* Titel Formatierung */}
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          border: '1px solid #4a5568',
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#a0aec0', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Titel-Formatierung
          </h4>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', color: '#cbd5e1' }}>Schriftgröße</label>
              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>{nameFontSize}px</span>
            </div>
            <input
              type="range"
              min="10" max="40"
              value={nameFontSize}
              onChange={(e) => setNameFontSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>
              Schriftart
            </label>
            <select
              value={nameFont}
              onChange={(e) => setNameFont(e.target.value)}
              style={{ width: '100%', background: '#4a5568', border: '1px solid #718096', color: '#e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '14px' }}
            >
              {fonts.map(font => <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>
              Ausrichtung
            </label>
            <select
              value={nameAlign}
              onChange={(e) => setNameAlign(e.target.value)}
              style={{ width: '100%', background: '#4a5568', border: '1px solid #718096', color: '#e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '14px' }}
            >
              <option value="left">Links</option>
              <option value="center">Zentriert</option>
              <option value="right">Rechts</option>
            </select>
          </div>
        </div>

        <hr style={{ border: 'none', height: '1px', background: '#4a5568', margin: '32px 0' }} />

        {/* Aktivität Sektion */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#a0aec0' }}>
            Aktivität
          </label>
           <div
            ref={activityDivRef}
            contentEditable
            onInput={(e) => setActivityContent(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: activityContent }}
            style={{
              width: '100%',
              background: '#1a202c',
              border: '1px solid #4a5568',
              borderRadius: '6px',
              padding: '12px',
              color: '#e2e8f0',
              fontSize: '14px',
              minHeight: '100px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Aktivität Formatierung */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px', border: '1px solid #4a5568' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#a0aec0', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Aktivität-Formatierung
          </h4>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', color: '#cbd5e1' }}>Schriftgröße</label>
              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>{activityFontSize}px</span>
            </div>
            <input
              type="range"
              min="10" max="40"
              value={activityFontSize}
              onChange={(e) => setActivityFontSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>
              Schriftart
            </label>
            <select
              value={activityFont}
              onChange={(e) => setActivityFont(e.target.value)}
              style={{ width: '100%', background: '#4a5568', border: '1px solid #718096', color: '#e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '14px' }}
            >
              {fonts.map(font => <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>
              Ausrichtung
            </label>
            <select
              value={activityAlign}
              onChange={(e) => setActivityAlign(e.target.value)}
              style={{ width: '100%', background: '#4a5568', border: '1px solid #718096', color: '#e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '14px' }}
            >
              <option value="left">Links</option>
              <option value="center">Zentriert</option>
              <option value="right">Rechts</option>
            </select>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};