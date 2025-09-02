import React, { useState, useEffect, useCallback } from 'react';
import { Character } from '../types';
import { apiService } from '../services/ApiService';
import { getCharacterImageUrl, getPlaceholderImage } from '../utils/imageUtils';
import './CharacterSelector.css';

interface CharacterSelectorProps {
  onCharactersSelect: (characters: Character[]) => void;
  onClose?: () => void;
  isVisible: boolean;
  maxSelection?: number;
  minSelection?: number;
  title?: string;
  description?: string;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  onCharactersSelect,
  onClose,
  isVisible,
  maxSelection = 5,
  minSelection = 1,
  title = 'キャラクターを選択',
  description,
}) => {
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>(
    []
  );
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>(
    'all'
  );

  // キャラクター一覧の取得
  const loadCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const characters = await apiService.getCharacters();
      console.log('Loaded characters:', characters);
      setAvailableCharacters(characters);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'キャラクターの読み込みに失敗しました';
      setError(errorMessage);
      console.error('Failed to load characters:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // フィルタリング済みキャラクター取得
  const getFilteredCharacters = useCallback(() => {
    console.log('Filtering characters:', { availableCharacters, filter });

    // availableCharactersが配列でない場合のガード
    if (!Array.isArray(availableCharacters)) {
      console.error(
        'availableCharacters is not an array:',
        availableCharacters
      );
      return [];
    }

    if (filter === 'all') {
      return availableCharacters;
    }
    return availableCharacters.filter(char => char.difficulty === filter);
  }, [availableCharacters, filter]);

  // ランダム選択機能
  const selectRandomCharacters = useCallback(() => {
    const filteredCharacters = getFilteredCharacters();
    const shuffled = [...filteredCharacters].sort(() => Math.random() - 0.5);
    const randomSelection = shuffled.slice(0, maxSelection);
    setSelectedCharacters(randomSelection);
  }, [getFilteredCharacters, maxSelection]);

  // キャラクター選択の切り替え
  const toggleCharacterSelection = useCallback(
    (character: Character) => {
      setSelectedCharacters(prev => {
        const isSelected = prev.find(c => c.id === character.id);

        if (isSelected) {
          return prev.filter(c => c.id !== character.id);
        } else {
          if (prev.length >= maxSelection) {
            return prev; // 最大選択数に達している場合は変更しない
          }
          return [...prev, character];
        }
      });
    },
    [maxSelection]
  );

  // 選択の確定
  const handleConfirmSelection = useCallback(() => {
    if (selectedCharacters.length >= minSelection) {
      onCharactersSelect(selectedCharacters);
    }
  }, [selectedCharacters, onCharactersSelect, minSelection]);

  // 選択をクリア
  const clearSelection = useCallback(() => {
    setSelectedCharacters([]);
  }, []);

  // コンポーネントが表示されたときにキャラクターを読み込む
  useEffect(() => {
    if (isVisible && availableCharacters.length === 0) {
      loadCharacters();
    }
  }, [isVisible, availableCharacters.length, loadCharacters]);

  // 難易度に応じた色を取得
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#f44336';
      default:
        return '#9E9E9E';
    }
  };

  // 難易度に応じた日本語ラベルを取得
  const getDifficultyLabel = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return '簡単';
      case 'medium':
        return '普通';
      case 'hard':
        return '難しい';
      default:
        return '不明';
    }
  };

  if (!isVisible) {
    return null;
  }

  const filteredCharacters = getFilteredCharacters();
  const canConfirm =
    selectedCharacters.length >= minSelection &&
    selectedCharacters.length <= maxSelection;

  return (
    <div className="character-selector">
      <div className="selector-header">
        <h2 className="selector-title">{title}</h2>
        {onClose && (
          <button
            className="selector-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        )}
      </div>

      {description && (
        <div className="selector-description">
          <p>{description}</p>
        </div>
      )}

      <div className="selector-content">
        <div className="selection-info">
          <div className="selection-count">
            選択中: {selectedCharacters.length} / {maxSelection}
            {minSelection > 1 && ` (最低${minSelection}個必要)`}
          </div>
          <div className="selection-controls">
            <button
              className="random-button"
              onClick={selectRandomCharacters}
              disabled={filteredCharacters.length === 0}
            >
              ランダム選択
            </button>
            <button
              className="clear-button"
              onClick={clearSelection}
              disabled={selectedCharacters.length === 0}
            >
              クリア
            </button>
          </div>
        </div>

        <div className="filter-controls">
          <span className="filter-label">難易度フィルター:</span>
          <div className="filter-buttons">
            {(['all', 'easy', 'medium', 'hard'] as const).map(level => (
              <button
                key={level}
                className={`filter-button ${filter === level ? 'active' : ''}`}
                onClick={() => setFilter(level)}
              >
                {level === 'all' ? 'すべて' : getDifficultyLabel(level)}
              </button>
            ))}
          </div>
        </div>

        <div className="characters-container">
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>キャラクターを読み込み中...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <h3>読み込みエラー</h3>
              <p>{error}</p>
              <button className="retry-button" onClick={loadCharacters}>
                再試行
              </button>
            </div>
          )}

          {!isLoading && !error && filteredCharacters.length === 0 && (
            <div className="empty-state">
              <h3>キャラクターが見つかりません</h3>
              <p>選択した難易度のキャラクターが存在しません。</p>
            </div>
          )}

          {!isLoading && !error && filteredCharacters.length > 0 && (
            <div className="characters-grid">
              {filteredCharacters.map(character => {
                const isSelected = selectedCharacters.find(
                  c => c.id === character.id
                );
                const isSelectable =
                  !isSelected && selectedCharacters.length < maxSelection;

                return (
                  <div
                    key={character.id}
                    className={`character-card ${isSelected ? 'selected' : ''} ${!isSelectable && !isSelected ? 'disabled' : ''}`}
                    onClick={() =>
                      (isSelectable || isSelected) &&
                      toggleCharacterSelection(character)
                    }
                  >
                    <div className="character-image">
                      <img
                        src={
                          character.imageUrl
                            ? getCharacterImageUrl(character.imageUrl)
                            : getPlaceholderImage(
                                character.name,
                                character.difficulty
                              )
                        }
                        alt={character.name}
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            getPlaceholderImage(
                              character.name,
                              character.difficulty
                            );
                        }}
                      />
                      {isSelected && (
                        <div className="selection-indicator">
                          <span className="checkmark">✓</span>
                        </div>
                      )}
                    </div>

                    <div className="character-info">
                      <h3 className="character-name">{character.name}</h3>
                      <p className="character-description">
                        {character.description}
                      </p>

                      <div className="character-meta">
                        <span
                          className="difficulty-badge"
                          style={{
                            backgroundColor: getDifficultyColor(
                              character.difficulty
                            ),
                          }}
                        >
                          {getDifficultyLabel(character.difficulty)}
                        </span>
                        {character.isFound && (
                          <span className="found-badge">発見済み</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedCharacters.length > 0 && (
          <div className="selected-characters">
            <h3>選択中のキャラクター:</h3>
            <div className="selected-list">
              {selectedCharacters.map(character => (
                <div key={character.id} className="selected-item">
                  <img
                    src={
                      character.imageUrl
                        ? getCharacterImageUrl(character.imageUrl)
                        : getPlaceholderImage(
                            character.name,
                            character.difficulty
                          )
                    }
                    alt={character.name}
                    className="selected-avatar"
                  />
                  <span className="selected-name">{character.name}</span>
                  <button
                    className="remove-selected"
                    onClick={() => toggleCharacterSelection(character)}
                    aria-label={`${character.name}を削除`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="selector-footer">
        <button
          className="confirm-button"
          onClick={handleConfirmSelection}
          disabled={!canConfirm}
        >
          選択を確定 ({selectedCharacters.length}個選択中)
        </button>
      </div>
    </div>
  );
};
