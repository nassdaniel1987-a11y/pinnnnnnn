// src/hooks/useIOSFixes.ts
import { useEffect } from 'react';

export const useIOSFixes = () => {
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) return;

    console.log('iOS detected - applying safe touch fixes');

    // --- 1. Kritischen Bounce verhindern ---
    const preventBounce = (e: TouchEvent) => {
      const pinnwand = document.getElementById('pinnwand-area');
      if (!pinnwand) return;

      if (pinnwand.scrollTop <= 0) {
        pinnwand.scrollTop = 1;
      }
      if (pinnwand.scrollTop >= pinnwand.scrollHeight - pinnwand.clientHeight) {
        pinnwand.scrollTop = pinnwand.scrollHeight - pinnwand.clientHeight - 1;
      }
    };

    // --- 2. Versehentliches Zoomen verhindern ---
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const pinnwandArea = document.getElementById('pinnwand-area');

    document.addEventListener('touchmove', preventBounce, { passive: false });
    document.body.addEventListener('touchmove', preventZoom, { passive: false });
    
    // --- 3. Viewport-Höhe anpassen ---
    const updateVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--real-vh', `${vh}px`);
        if (pinnwandArea) {
            // Passe die Höhe der Pinnwand an, um die Adressleiste zu kompensieren
            pinnwandArea.style.height = `calc(var(--real-vh, 1vh) * 100 - 52px)`; // 52px ist die Header-Höhe
        }
    };

    updateVH();
    window.addEventListener('resize', updateVH);
    window.addEventListener('orientationchange', updateVH);

    // Cleanup-Funktion: Wird ausgeführt, wenn die Komponente verschwindet
    return () => {
      document.removeEventListener('touchmove', preventBounce);
      document.body.removeEventListener('touchmove', preventZoom);
      window.removeEventListener('resize', updateVH);
      window.removeEventListener('orientationchange', updateVH);
    };
  }, []); // Leeres Array bedeutet: Führe diesen Effekt nur einmal aus
};