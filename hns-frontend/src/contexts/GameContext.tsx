import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { Character } from '../types';
import {
  generateRandomCharacterPositions,
  calculateGameStats,
  isGameComplete,
} from '../utils/gameUtils';

interface GameStats {
  total: number;
  found: number;
  remaining: number;
  progress: number;
}

interface GameContextType {
  gameCharacters: Character[];
  gameStarted: boolean;
  showHints: boolean;
  gameStats: GameStats;
  startGame: (characters: Character[]) => void;
  handleCharacterFound: (character: Character) => void;
  toggleHints: () => void;
  resetGame: () => void;
}

export const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gameCharacters, setGameCharacters] = useState<Character[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    total: 0,
    found: 0,
    remaining: 0,
    progress: 0,
  });

  const startGame = useCallback((characters: Character[]) => {
    const randomizedCharacters = generateRandomCharacterPositions(characters);
    setGameCharacters(randomizedCharacters);
    setGameStarted(true);
    setShowHints(false);
  }, []);

  const handleCharacterFound = useCallback((character: Character) => {
    setGameCharacters(prev =>
      prev.map(char =>
        char.id === character.id ? { ...char, isFound: true } : char
      )
    );

    alert(`🎉 ${character.name}を発見しました！\n${character.description}`);
  }, []);

  const toggleHints = useCallback(() => {
    setShowHints(prev => !prev);
  }, []);

  const resetGame = useCallback(() => {
    setGameCharacters([]);
    setGameStarted(false);
    setShowHints(false);
    setGameStats({ total: 0, found: 0, remaining: 0, progress: 0 });
  }, []);

  // ゲーム統計の更新
  useEffect(() => {
    if (gameCharacters.length > 0) {
      const stats = calculateGameStats(gameCharacters);
      setGameStats(stats);

      if (isGameComplete(gameCharacters)) {
        alert(
          `🎉 ゲームクリア！\n全${stats.total}体のキャラクターを発見しました！`
        );
      }
    }
  }, [gameCharacters]);

  const value = useMemo(
    () => ({
      gameCharacters,
      gameStarted,
      showHints,
      gameStats,
      startGame,
      handleCharacterFound,
      toggleHints,
      resetGame,
    }),
    [
      gameCharacters,
      gameStarted,
      showHints,
      gameStats,
      startGame,
      handleCharacterFound,
      toggleHints,
      resetGame,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
