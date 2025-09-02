import { useState, useRef, useCallback } from 'react';
import { googleMapsService } from '../services/GoogleMapsService';

interface UseStreetViewReturn {
  streetView: google.maps.StreetViewPanorama | null;
  isLoading: boolean;
  error: string | null;
  initializeStreetView: (
    element: HTMLElement,
    position: google.maps.LatLngLiteral
  ) => Promise<void>;
  updatePosition: (position: google.maps.LatLngLiteral) => void;
}

export const useStreetView = (): UseStreetViewReturn => {
  const [streetView, setStreetView] =
    useState<google.maps.StreetViewPanorama | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);

  const initializeStreetView = useCallback(
    async (element: HTMLElement, position: google.maps.LatLngLiteral) => {
      setIsLoading(true);
      setError(null);

      try {
        const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
          position,
          pov: {
            heading: 0,
            pitch: 0,
          },
          zoom: 1,
          visible: true,
          addressControl: false,
          linksControl: true,
          panControl: true,
          enableCloseButton: false,
          fullscreenControl: false,
          motionTracking: false,
          motionTrackingControl: false,
          showRoadLabels: true,
        };

        const streetViewInstance =
          await googleMapsService.createStreetViewPanorama(
            element,
            streetViewOptions
          );

        // ストリートビューが利用可能かチェック
        const streetViewService = new google.maps.StreetViewService();
        streetViewService.getPanorama(
          {
            location: position,
            radius: 100,
          },
          (data, status) => {
            if (status === google.maps.StreetViewStatus.OK) {
              streetViewInstance.setVisible(true);
            } else {
              setError('この場所ではストリートビューが利用できません');
              console.warn('Street View not available at this location');
            }
          }
        );

        streetViewRef.current = streetViewInstance;
        setStreetView(streetViewInstance);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to initialize Street View';
        setError(errorMessage);
        console.error('Street View initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updatePosition = useCallback((position: google.maps.LatLngLiteral) => {
    if (streetViewRef.current) {
      streetViewRef.current.setPosition(position);
      setError(null);

      // 新しい位置でストリートビューが利用可能かチェック
      const streetViewService = new google.maps.StreetViewService();
      streetViewService.getPanorama(
        {
          location: position,
          radius: 100,
        },
        (data, status) => {
          if (status !== google.maps.StreetViewStatus.OK) {
            setError('この場所ではストリートビューが利用できません');
          }
        }
      );
    }
  }, []);

  return {
    streetView,
    isLoading,
    error,
    initializeStreetView,
    updatePosition,
  };
};