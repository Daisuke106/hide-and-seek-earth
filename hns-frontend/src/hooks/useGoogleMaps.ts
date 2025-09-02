import { useState, useEffect, useRef, useCallback } from 'react';
import { googleMapsService } from '../services/GoogleMapsService';
import { MapSettings } from '../types';

interface UseGoogleMapsReturn {
  map: google.maps.Map | null;
  isLoading: boolean;
  error: string | null;
  initializeMap: (
    element: HTMLElement,
    options?: google.maps.MapOptions
  ) => Promise<void>;
}

export const useGoogleMaps = (
  initialSettings?: MapSettings
): UseGoogleMapsReturn => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const initializeMap = useCallback(
    async (element: HTMLElement, options?: google.maps.MapOptions) => {
      setIsLoading(true);
      setError(null);

      try {
        const defaultOptions: google.maps.MapOptions = {
          center: initialSettings?.center || { lat: 35.6762, lng: 139.6503 }, // Tokyo
          zoom: initialSettings?.zoom || 10,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
        };

        const mapInstance = await googleMapsService.createMap(element, {
          ...defaultOptions,
          ...options,
        });

        mapRef.current = mapInstance;
        setMap(mapInstance);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to initialize Google Maps';
        setError(errorMessage);
        console.error('Google Maps initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [initialSettings]
  );

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        // Cleanup if necessary
        mapRef.current = null;
      }
    };
  }, []);

  return {
    map,
    isLoading,
    error,
    initializeMap,
  };
};
