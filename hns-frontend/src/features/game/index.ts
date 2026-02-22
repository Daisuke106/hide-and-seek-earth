// Game feature barrel exports
// Components are still in src/components/ for now.
// As the project grows, move them here:
// export { GameMap } from './components/GameMap';
// export { StreetViewPanel } from './components/StreetViewPanel';
// export { SearchPanel } from './components/SearchPanel';

// Contexts
export { GameContext, GameProvider } from '../../contexts/GameContext';
export { MapContext, MapProvider } from '../../contexts/MapContext';

// Hooks
export { useGameState } from '../../hooks/useGameState';
export { useMapState } from '../../hooks/useMapState';
export { useCharacterSearch } from '../../hooks/useCharacterSearch';

// Utils
export {
  generateRandomCharacterPositions,
  calculateGameStats,
  isGameComplete,
} from '../../utils/gameUtils';
