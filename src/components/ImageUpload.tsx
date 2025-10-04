import { useState } from 'react';
import type { Note } from '../types/types';
import { updateNoteInDB } from '../lib/supabaseClient';
import { getSupabase } from '../lib/supabaseClient';
import { dataURLtoBlob } from '../utils/utils';

interface ImageUploadProps {
  note: Note;
}

export const ImageUpload = ({ note }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const blob = dataURLtoBlob(dataUrl);
        
        const supabase = getSupabase();
        const fileName = `${note.id}-${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('zettel_bilder')
          .upload(fileName, blob);

        if (uploadError) {
          console.error('Upload Fehler:', uploadError);
          alert('Fehler beim Hochladen des Bildes');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('zettel_bilder')
          .getPublicUrl(fileName);

        await updateNoteInDB(note.id, { 
          image: publicUrl,
          has_image: true 
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Verarbeiten des Bildes');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!note.image) return;
    
    if (!window.confirm('Bild wirklich entfernen?')) return;

    try {
      const supabase = getSupabase();
      const fileName = note.image.split('/').pop();
      if (fileName) {
        await supabase.storage.from('zettel_bilder').remove([fileName]);
      }

      await updateNoteInDB(note.id, { 
        image: null,
        has_image: false 
      });
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  if (note.image) {
    return (
      <div style={{
        position: 'relative',
        flexGrow: 1,
        borderRadius: '8px',
        overflow: 'hidden',
        minHeight: '80px',
      }}>
        <img
          src={note.image}
          alt="Zettel Bild"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <button
          onClick={handleRemoveImage}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      flexGrow: 1,
      borderRadius: '8px',
      border: '2px dashed #e2e8f0',
      minHeight: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      background: '#f8fafc',
    }}>
      <label style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        padding: '16px',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
      }}>
        {isUploading ? (
          <>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#3b82f6' }}></i>
            <span style={{ fontSize: '12px', color: '#3b82f6' }}>Lädt hoch...</span>
          </>
        ) : (
          <>
            <i className="fas fa-image" style={{ fontSize: '24px', color: '#9ca3af' }}></i>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#9ca3af' }}>Bild hinzufügen</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
      </label>
    </div>
  );
};