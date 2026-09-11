import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { EnnoreDemoData } from '../types';

interface AppContextType {
  data: EnnoreDemoData | null;
  loading: boolean;
  error: string | null;
  
  selectedVessel: string | null;
  setSelectedVessel: (id: string | null) => void;
  
  playbackTime: number | null;
  setPlaybackTime: React.Dispatch<React.SetStateAction<number | null>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  
  layers: {
    sar: boolean;
    sarOpacity: number;
    unet: boolean;
    unetOpacity: number;
    slick: boolean;
    driftOrigin: boolean;
    driftHeatmap: boolean;
    driftForecast: boolean;
    vessels: boolean;
  };
  setLayers: (layers: any) => void;
  
  playbackData: any | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EnnoreDemoData | null>(null);
  const [playbackData, setPlaybackData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  
  const [playbackTime, setPlaybackTime] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [layers, setLayers] = useState({
    sar: true,
    sarOpacity: 0.25,
    unet: false,
    unetOpacity: 0.7,
    slick: true,
    driftOrigin: true,
    driftHeatmap: true,
    driftForecast: false,
    vessels: true
  });

  useEffect(() => {
    fetch('/api/demo/ennore')
      .then(res => res.json())
      .then(d => {
         setData(d);
         // Set initial playback time to earliest AIS time
         if (d.ais?.playback_asset) {
            fetch(d.ais.playback_asset)
              .then(res => res.json())
              .then(pb => {
                 setPlaybackData(pb);
                 // find min time
                 let minTime = Infinity;
                 Object.values(pb).forEach((arr: any) => {
                    if (arr.length > 0 && arr[0].time < minTime) minTime = arr[0].time;
                 });
                 if (minTime !== Infinity) {
                    setPlaybackTime(minTime);
                 }
                 setLoading(false);
              })
              .catch(err => {
                 console.error("Playback fetch error:", err);
                 setLoading(false);
              });
         } else {
            setLoading(false);
         }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <AppContext.Provider value={{ 
       data, loading, error, 
       selectedVessel, setSelectedVessel,
       playbackTime, setPlaybackTime,
       isPlaying, setIsPlaying,
       layers, setLayers,
       playbackData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within AppProvider');
  return context;
}
