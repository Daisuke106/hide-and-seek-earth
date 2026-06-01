import { useState, useCallback } from 'react';
import { Character } from '../types';
import { apiService } from '../services/ApiService';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

export const useCharacterSearch = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DifficultyFilter>('all');

  const loadCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.getCharacters();
      setCharacters(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'キャラクターの読み込みに失敗しました';
      setError(errorMessage);

      if (
        process.env.NODE_ENV === 'development' &&
        err instanceof Error &&
        err.message.includes('Network connection error')
      ) {
        setCharacters([]);
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredCharacters =
    filter === 'all'
      ? characters
      : characters.filter(char => char.difficulty === filter);

  return {
    characters,
    filteredCharacters,
    isLoading,
    error,
    filter,
    setFilter,
    loadCharacters,
  };
};
