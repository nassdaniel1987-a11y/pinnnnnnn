import { useEffect, useState } from 'react';
import { initSupabase } from './lib/supabaseClient';
import { useAppStore } from './store/appStore';
import { Header } from './components/Header';
import { PinnwandArea } from './components/PinnwandArea';
import { FAB } from './components/FAB';
import { QuickActionsToolbar } from './components/QuickActionsToolbar';
import { SideEditor } from './components/SideEditor';

function App() {
  const { currentTheme } = useAppStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initSupabase();
    setIsReady(true);
  }, []);

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