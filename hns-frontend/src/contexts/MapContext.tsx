import React, { createContext, useState, useCallback, useMemo } from 'react';

interface MapContextType {
  selectedPosition: google.maps.LatLngLiteral | null;
  showStreetView: boolean;
  showSearch: boolean;
  currentMap: google.maps.Map | null;
  handleMapClick: (position: google.maps.LatLngLiteral) => void;
  handleLocationSelect: (position: google.maps.LatLngLiteral) => void;
  handleMapReady: (map: google.maps.Map) => void;
  toggleStreetView: () => void;
  toggleSearch: () => void;
  setShowStreetView: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
}

export const MapContext = createContext<MapContextType | null>(null);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedPosition, setSelectedPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [showStreetView, setShowStreetView] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentMap, setCurrentMap] = useState<google.maps.Map | null>(null);

  const handleMapClick = useCallback((position: google.maps.LatLngLiteral) => {
    setSelectedPosition(position);
    setShowStreetView(true);
  }, []);

  const handleLocationSelect = useCallback(
    (position: google.maps.LatLngLiteral) => {
      if (currentMap) {
        currentMap.setCenter(position);
        currentMap.setZoom(15);
      }
      setSelectedPosition(position);
      setShowSearch(false);
    },
    [currentMap]
  );

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setCurrentMap(map);
  }, []);

  const toggleStreetView = useCallback(() => {
    setShowStreetView(prev => !prev);
  }, []);

  const toggleSearch = useCallback(() => {
    setShowSearch(prev => !prev);
  }, []);

  const value = useMemo(
    () => ({
      selectedPosition,
      showStreetView,
      showSearch,
      currentMap,
      handleMapClick,
      handleLocationSelect,
      handleMapReady,
      toggleStreetView,
      toggleSearch,
      setShowStreetView,
      setShowSearch,
    }),
    [
      selectedPosition,
      showStreetView,
      showSearch,
      currentMap,
      handleMapClick,
      handleLocationSelect,
      handleMapReady,
      toggleStreetView,
      toggleSearch,
    ]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
