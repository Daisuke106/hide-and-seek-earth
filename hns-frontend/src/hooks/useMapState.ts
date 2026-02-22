import { useContext } from 'react';
import { MapContext } from '../contexts/MapContext';

export const useMapState = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapState must be used within a MapProvider');
  }
  return context;
};
