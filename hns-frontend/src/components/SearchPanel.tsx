import React, { useState, useCallback, useEffect } from 'react';
import { googleMapsService } from '../services/GoogleMapsService';
import { SearchResult } from '../types';
import './SearchPanel.css';

interface SearchPanelProps {
  map: google.maps.Map | null;
  onLocationSelect: (position: google.maps.LatLngLiteral) => void;
  onClose?: () => void;
  isVisible: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  map,
  onLocationSelect,
  onClose,
  isVisible,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !map) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setSelectedIndex(-1);

    try {
      const searchResults = await googleMapsService.searchPlaces(query, map);
      setResults(searchResults);

      if (searchResults.length === 0) {
        setError(
          '検索結果が見つかりませんでした。別のキーワードで試してください。'
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '検索中にエラーが発生しました';
      setError(errorMessage);
      setResults([]);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [query, map]);

  const handleLocationClick = useCallback(
    (result: SearchResult) => {
      onLocationSelect(result.position);
      setQuery(result.name);
      setResults([]);
      setSelectedIndex(-1);
    },
    [onLocationSelect]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!results.length) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleLocationClick(results[selectedIndex]);
          } else {
            handleSearch();
          }
          break;
        case 'Escape':
          setResults([]);
          setSelectedIndex(-1);
          break;
      }
    },
    [results, selectedIndex, handleLocationClick, handleSearch]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setError(null);
    },
    []
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setSelectedIndex(-1);
  }, []);

  // ESCキーでパネルを閉じる
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible && onClose) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [isVisible, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="search-panel">
      <div className="search-header">
        <h3 className="search-title">場所を検索</h3>
        {onClose && (
          <button
            className="search-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        )}
      </div>

      <div className="search-content">
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="場所、建物、ランドマークを検索..."
            className="search-input"
            disabled={isSearching}
            autoFocus
          />
          <div className="search-buttons">
            {query && (
              <button
                type="button"
                className="clear-button"
                onClick={clearSearch}
                aria-label="クリア"
              >
                ×
              </button>
            )}
            <button
              type="button"
              className="search-button"
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
            >
              {isSearching ? '検索中...' : '検索'}
            </button>
          </div>
        </div>

        {error && (
          <div className="search-error">
            <p>{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="search-results">
            <div className="results-header">
              <span className="results-count">{results.length}件の結果</span>
            </div>
            <ul className="results-list">
              {results.map((result, index) => (
                <li
                  key={result.placeId}
                  className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleLocationClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="result-content">
                    <div className="result-name">{result.name}</div>
                    <div className="result-address">{result.address}</div>
                    <div className="result-coords">
                      {result.position.lat.toFixed(6)},{' '}
                      {result.position.lng.toFixed(6)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="search-hints">
          <h4>検索のヒント:</h4>
          <ul>
            <li>「東京駅」「渋谷スカイ」などの有名な場所</li>
            <li>「パリ エッフェル塔」など国名と組み合わせ</li>
            <li>「New York Central Park」など英語での検索</li>
            <li>キーボードの↑↓で選択、Enterで決定</li>
          </ul>
        </div>
      </div>
    </div>
  );
};