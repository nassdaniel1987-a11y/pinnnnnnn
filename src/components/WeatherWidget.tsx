import { useState, useEffect } from 'react';

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<{
    temp: number;
    precipitation: number;
    icon: string;
  } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Stuttgart-Vaihingen Koordinaten (wie im Original)
        const lat = 48.73;
        const lon = 9.11;
        const today = new Date().toISOString().split('T')[0];
        
        const response = await fetch(
          `https://api.brightsky.dev/weather?lat=${lat}&lon=${lon}&date=${today}`
        );
        
        if (!response.ok) throw new Error('Wetter API Fehler');
        
        const data = await response.json();
        
        if (!data.weather || data.weather.length === 0) {
          throw new Error('Keine Wetterdaten');
        }
        
        const now = new Date();
        const pastWeather = data.weather.filter((w: any) => new Date(w.timestamp) <= now);
        const currentWeather = pastWeather[pastWeather.length - 1];
        const forecastWeather = data.weather.find((w: any) => new Date(w.timestamp) > now);
        
        if (!currentWeather) throw new Error('Keine aktuellen Daten');
        
        const temp = Math.round(currentWeather.temperature);
        const condition = currentWeather.condition;
        const cloudCover = currentWeather.cloud_cover;
        const precipitation = forecastWeather?.precipitation_probability ?? 0;
        
        const iconClass = getWeatherIcon(condition, cloudCover);
        
        setWeather({ temp, precipitation, icon: iconClass });
      } catch (error) {
        console.error('Wetter-Fehler:', error);
        setWeather({ temp: 0, precipitation: 0, icon: 'fa-exclamation-triangle' });
      }
    };
    
    fetchWeather();
    const interval = setInterval(fetchWeather, 900000); // Alle 15 Minuten
    
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (condition: string, cloudCover: number) => {
    if (condition === 'dry') {
      if (cloudCover < 20) return 'fa-sun';
      if (cloudCover < 70) return 'fa-cloud-sun';
      return 'fa-cloud';
    }
    
    switch (condition) {
      case 'clear':
      case 'mostly-clear':
        return 'fa-sun';
      case 'partly-cloudy':
        return 'fa-cloud-sun';
      case 'cloudy':
      case 'overcast':
        return 'fa-cloud';
      case 'fog':
      case 'fog-patches':
        return 'fa-smog';
      case 'light-rain':
      case 'rain':
      case 'heavy-rain':
      case 'showers':
      case 'drizzle':
        return 'fa-cloud-showers-heavy';
      case 'light-snow':
      case 'snow':
      case 'heavy-snow':
        return 'fa-snowflake';
      case 'thunderstorm':
        return 'fa-bolt';
      default:
        return 'fa-question-circle';
    }
  };

  if (!weather) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <i className="fas fa-spinner fa-spin" style={{ color: 'white', fontSize: '14px' }}></i>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.15)',
      padding: '6px 12px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <i className={`fas ${weather.icon}`} style={{ color: 'white', fontSize: '16px' }}></i>
      <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
        {weather.temp}°C
      </span>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.9)',
      }}>
        <i className="fas fa-umbrella" style={{ fontSize: '11px' }}></i>
        <span>{weather.precipitation}%</span>
      </div>
    </div>
  );
};