import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { themes } from '../config/config';
import type { ThemeName } from '../types/types';

export const ThemeSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, setCurrentTheme } = useAppStore();

  const themeImages: Record<ThemeName, string> = {
    chalkboard: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/chalkboard_preview.png',
    space: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/ChatGPT%20Image%2017.%20Sept.%202025,%2004_24_32%20(1).png',
    sweets: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/Gemini_Generated_Image_pdhp4ipdhp4ipdhp%20(1).png',
    dino: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/generated-image%20(1).png',
    agent: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/Gemini_Generated_Image_bksinhbksinhbksi%20(1).png',
    vfb: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/ChatGPT%20Image%2018.%20Sept.%202025,%2004_00_12%20(1).png',
    pokemon: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/Gemini_Generated_Image_1175px1175px1175%20(1).png',
    pokemon2: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/Gemini_Generated_Image_2j39ot2j39ot2j39%20(1).png',
    pippi: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/Gemini_Generated_Image_h3sqy5h3sqy5h3sq%20(1).png',
    magictimals: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/Gemini_Generated_Image_sngn87sngn87sngn%20(1).png',
    minecraft: 'https://yhijcboegdbxcctiwyof.supabase.co/storage/v1/object/public/theme_backgrounds/Gemini_Generated_Image_h9j7xeh9j7xeh9j7%20(1).png',
  };

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
        title="Theme wechseln"
      >
        <i className="fas fa-palette"></i>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '220px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            padding: '12px',
            zIndex: 1100,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {themes.map((theme) => (
              <div
                key={theme}
                onClick={() => handleThemeChange(theme)}
                style={{
                  width: '100%',
                  height: '36px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#eee',
                  border: currentTheme === theme ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <img
                  src={themeImages[theme]}
                  alt={theme}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};