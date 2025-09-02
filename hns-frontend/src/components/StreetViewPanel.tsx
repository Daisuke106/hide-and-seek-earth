import React, { useRef, useEffect, useState } from 'react';
import { useStreetView } from '../hooks/useStreetView';
import { Character } from '../types';
import { generateCharacterStreetViewPositions } from '../utils/streetViewUtils';
import './StreetViewPanel.css';

interface StreetViewPanelProps {
  position: google.maps.LatLngLiteral | null;
  isVisible: boolean;
  onClose?: () => void;
  title?: string;
  characters?: Character[];
  onCharacterFound?: (character: Character) => void;
}

export const StreetViewPanel: React.FC<StreetViewPanelProps> = ({
  position,
  isVisible,
  onClose,
  title = 'ストリートビュー',
  characters = [],
  onCharacterFound
}) => {
  const streetViewElementRef = useRef<HTMLDivElement>(null);
  const { streetView, isLoading, error, initializeStreetView, updatePosition } = useStreetView();
  const [isInitialized, setIsInitialized] = useState(false);
  const [streetViewCharacters, setStreetViewCharacters] = useState<Character[]>([]);

  // ストリートビューの初期化
  useEffect(() => {
    if (streetViewElementRef.current && position && isVisible && !streetView) {
      initializeStreetView(streetViewElementRef.current, position).then(() => {
        setIsInitialized(true);
      });
    }
  }, [streetView, initializeStreetView, position, isVisible]);

  // 位置の更新
  useEffect(() => {
    if (streetView && position && isInitialized) {
      updatePosition(position);
    }
  }, [streetView, position, updatePosition, isInitialized]);

  // キャラクターの位置をランダムに生成
  useEffect(() => {
    if (position && characters.length > 0) {
      const randomizedCharacters = generateCharacterStreetViewPositions(characters, position);
      setStreetViewCharacters(randomizedCharacters);
    }
  }, [position, characters]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="street-view-panel">
      <div className="street-view-header">
        <h3 className="street-view-title">{title}</h3>
        {onClose && (
          <button className="street-view-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        )}
      </div>

      <div className="street-view-content">
        {position && (
          <div className="position-info">
            <span className="position-coords">
              緯度: {position.lat.toFixed(6)}, 経度: {position.lng.toFixed(6)}
            </span>
          </div>
        )}

        <div className="street-view-container">
          {isLoading && (
            <div className="street-view-loading">
              <div className="loading-spinner"></div>
              <p>ストリートビューを読み込み中...</p>
            </div>
          )}

          {error && (
            <div className="street-view-error">
              <h4>ストリートビューエラー</h4>
              <p>{error}</p>
              <p>この場所ではストリートビューが利用できない可能性があります。</p>
            </div>
          )}

          {!position && (
            <div className="street-view-placeholder">
              <h4>位置を選択してください</h4>
              <p>マップ上の場所をクリックするとストリートビューが表示されます。</p>
            </div>
          )}

          <div 
            ref={streetViewElementRef}
            className="street-view"
            style={{ 
              display: (!isLoading && !error && position) ? 'block' : 'none',
              width: '100%',
              height: '100%'
            }}
          />
        </div>
      </div>

      <div className="street-view-controls">
        <div className="control-group">
          <span className="control-label">操作:</span>
          <span className="control-hint">ドラッグで視点変更 | マウスホイールでズーム</span>
        </div>
        
        {streetViewCharacters.length > 0 && (
          <div className="character-hints">
            <h4>🎯 この周辺に隠れているキャラクター:</h4>
            <div className="character-list">
              {streetViewCharacters
                .filter(char => char.isVisibleInStreetView && !char.isFound)
                .map(character => (
                  <div key={character.id} className="character-hint">
                    <span className="character-name">{character.name}</span>
                    <span className={`difficulty-badge ${character.difficulty}`}>
                      {character.difficulty}
                    </span>
                    <button
                      className="discovery-button"
                      onClick={() => onCharacterFound && onCharacterFound(character)}
                      disabled={character.isFound}
                    >
                      {character.isFound ? '発見済み' : '発見！'}
                    </button>
                  </div>
                ))
              }
            </div>
            <p className="hint-text">
              💡 ヒント: 周りを見回してキャラクターを探してみてください！
              建物、看板、道路標識などに隠れているかもしれません。
              キャラクターを見つけたら「発見！」ボタンを押してください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};