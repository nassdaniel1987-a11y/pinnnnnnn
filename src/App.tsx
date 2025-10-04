import { useEffect, useState } from 'react';
import { initSupabase } from './lib/supabaseClient';
import { useAppStore } from './store/appStore';
import { Header } from './components/Header';
import { PinnwandArea } from './components/PinnwandArea';
import { FAB } from './components/FAB';
import { QuickActionsToolbar } from './components/QuickActionsToolbar';
import { SideEditor } from './components/SideEditor';

function App() {
  const { currentTheme, localNotes } = useAppStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initSupabase();
    setIsReady(true);
  }, []);

  // Clock Update
  useEffect(() => {
    const updateClock = () => {
      const clockElement = document.getElementById('header-clock');
      if (clockElement) {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString('de-DE');
      }
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto Open/Close Timer
  useEffect(() => {
    const checkAutoOpenClose = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentTime = `${String(currentHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // Nachtruhe: 17-7 Uhr keine Auto-Aktionen
      if (currentHour >= 17 || currentHour < 7) {
        return;
      }

      const { updateNoteInDB } = await import('./lib/supabaseClient');
      
      for (const note of localNotes) {
        // Auto-Öffnen wenn closedUntil Zeit erreicht
        if (note.closedUntil && note.closedUntil !== 'LOCKED' && currentTime >= note.closedUntil) {
          await updateNoteInDB(note.id, { closedUntil: null });
        }
        
        // Auto-Schließen wenn closeAt Zeit erreicht
        if (note.closeAt && currentTime >= note.closeAt && !note.closedUntil) {
          await updateNoteInDB(note.id, { closedUntil: 'LOCKED' });
        }
      }
    };

    // Alle 250ms checken
    const interval = setInterval(checkAutoOpenClose, 250);
    
    return () => clearInterval(interval);
  }, [localNotes]);

  if (!isReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem' }}></i>
      </div>
    );
  }

  return (
    <div 
      className="app-container flex flex-col h-screen max-w-screen overflow-hidden"
      data-theme={currentTheme}
    >
      <Header />
      <PinnwandArea />
      <QuickActionsToolbar />
      <FAB />
      <SideEditor />
    </div>
  );
}

export default App;