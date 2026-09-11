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
    vesselSelectedTrack: boolean;
    vesselOtherTracks: boolean;
    vesselHistoricalTrail: boolean;
    vesselCurrentPosition: boolean;
    vesselOriginPoint: boolean;
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
    vessels: true,
    vesselSelectedTrack: true,
    vesselOtherTracks: true,
    vesselHistoricalTrail: true,
    vesselCurrentPosition: true,
    vesselOriginPoint: true,
  });

  useEffect(() => {
    fetch('/api/demo/ennore')
      .then(res => res.json())
      .then(d => {
        setData(d);
        if (d.vessels && d.vessels.length > 0) {
          setSelectedVessel(d.vessels[0].id);
        }
        
        // Fetch playback data separately
        if (d.ais?.playback_asset) {
          fetch(d.ais.playback_asset)
            .then(async (res) => {
              if (res.status === 404) throw new Error("FILE_NOT_FOUND");
              if (!res.ok) throw new Error(`HTTP_ERROR (${res.status})`);
              
              const contentType = res.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Expected AIS JSON but received non-JSON response:", text.substring(0, 100));
                throw new Error("INVALID_JSON (Received HTML/Fallback)");
              }
              return res.json();
            })
            .then(pb => {
              if (!pb || Object.keys(pb).length === 0) {
                throw new Error("EMPTY_DATA");
              }
              // Basic schema check
              const firstKey = Object.keys(pb)[0];
              if (!Array.isArray(pb[firstKey])) {
                throw new Error("INVALID_SCHEMA");
              }

              setPlaybackData(pb);
              let minTimeSec = Infinity;
              Object.values(pb).forEach((arr: any) => {
                if (arr.length > 0 && (arr[0].time * 1000) < minTimeSec) {
                  minTimeSec = arr[0].time * 1000;
                }
              });
              if (minTimeSec !== Infinity) {
                setPlaybackTime(minTimeSec);
              }
              setError(null);
              setLoading(false);
            })
            .catch(err => {
              console.error("Playback fetch error:", err);
              setError(err.message);
              setLoading(false);
            });
        } else {
          setError("FILE_NOT_FOUND (No playback_asset in config)");
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
