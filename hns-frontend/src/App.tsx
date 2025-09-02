import React, { useState, useCallback, useEffect } from 'react';
import { Character } from './types';
import { GameMap } from './components/GameMap';
import { StreetViewPanel } from './components/StreetViewPanel';
import { SearchPanel } from './components/SearchPanel';
import { CharacterSelector } from './components/CharacterSelector';
import GoogleMapsLoader from './components/GoogleMapsLoader';
import {
  generateRandomCharacterPositions,
  calculateGameStats,
  isGameComplete,
} from './utils/gameUtils';
import './App.css';

function App() {
  const [gameCharacters, setGameCharacters] = useState<Character[]>([]);
  const [selectedPosition, setSelectedPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [showStreetView, setShowStreetView] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(true);
  const [currentMap, setCurrentMap] = useState<google.maps.Map | null>(null);

  // ゲーム状態
  const [gameStarted, setGameStarted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [gameStats, setGameStats] = useState({
    total: 0,
    found: 0,
    remaining: 0,
    progress: 0,
  });

  const handleCharactersSelect = useCallback((characters: Character[]) => {
    // キャラクターを選択したらゲームを開始
    const randomizedCharacters = generateRandomCharacterPositions(characters);
    setGameCharacters(randomizedCharacters);
    setShowCharacterSelector(false);
    setGameStarted(true);
  }, []);

  // ゲーム統計の更新
  useEffect(() => {
    if (gameCharacters.length > 0) {
      const stats = calculateGameStats(gameCharacters);
      setGameStats(stats);

      // ゲームクリアチェック
      if (isGameComplete(gameCharacters)) {
        alert(
          `🎉 ゲームクリア！\n全${stats.total}体のキャラクターを発見しました！`
        );
      }
    }
  }, [gameCharacters]);

  const handleCharacterFound = useCallback((character: Character) => {
    console.log('Character found:', character);

    // キャラクターを発見済みに更新
    setGameCharacters(prev =>
      prev.map(char =>
        char.id === character.id ? { ...char, isFound: true } : char
      )
    );

    alert(`🎉 ${character.name}を発見しました！\n${character.description}`);
  }, []);

  const handleToggleHints = useCallback(() => {
    setShowHints(prev => !prev);
  }, []);

  const handleMapClick = useCallback((position: google.maps.LatLngLiteral) => {
    setSelectedPosition(position);
    setShowStreetView(true);
  }, []);

  const handleLocationSelect = useCallback(
    (position: google.maps.LatLngLiteral) => {
      // 検索で選択した場合はマップを中心に移動し、ストリートビューは表示しない
      if (currentMap) {
        currentMap.setCenter(position);
        currentMap.setZoom(15); // ズームレベルを上げて詳細表示
      }
      setSelectedPosition(position);
      setShowSearch(false);
      // ストリートビューは表示しない
    },
    [currentMap]
  );

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setCurrentMap(map);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌍 地球全体でかくれんぼ</h1>

        {gameStarted && (
          <div className="game-stats">
            <div className="stats-item">
              <span className="stats-label">進捗:</span>
              <span className="stats-value">
                {gameStats.found}/{gameStats.total} ({gameStats.progress}%)
              </span>
            </div>
            <div className="stats-item">
              <span className="stats-label">残り:</span>
              <span className="stats-value">{gameStats.remaining}体</span>
            </div>
          </div>
        )}

        <div className="header-controls">
          <button
            className="control-button"
            onClick={() => setShowSearch(!showSearch)}
          >
            🔍 検索
          </button>

          {!gameStarted && (
            <button
              className="control-button"
              onClick={() => setShowCharacterSelector(true)}
            >
              👾 ゲーム開始
            </button>
          )}

          {gameStarted && (
            <button
              className="control-button"
              onClick={handleToggleHints}
              style={{ backgroundColor: showHints ? '#ff4444' : undefined }}
            >
              💡 {showHints ? 'ヒント非表示' : 'ヒント表示'}
            </button>
          )}

          <button
            className="control-button"
            onClick={() => setShowStreetView(!showStreetView)}
            disabled={!selectedPosition}
          >
            📷 ストリートビュー
          </button>
        </div>
      </header>

      <main className="App-main">
        <GoogleMapsLoader>
          <div className="game-layout">
            <div className="map-container">
              <GameMap
                characters={gameCharacters}
                onCharacterClick={handleCharacterFound}
                onMapClick={handleMapClick}
                center={{ lat: 35.6762, lng: 139.6503 }} // Tokyo
                zoom={2} // 世界全体を表示
                onMapReady={handleMapReady}
                showCharacters={showHints}
                gameStarted={gameStarted}
              />
            </div>

            <div className="panels-container">
              {showSearch && (
                <div className="panel">
                  <SearchPanel
                    map={currentMap}
                    onLocationSelect={handleLocationSelect}
                    onClose={() => setShowSearch(false)}
                    isVisible={showSearch}
                  />
                </div>
              )}

              {showStreetView && selectedPosition && (
                <div className="panel">
                  <StreetViewPanel
                    position={selectedPosition}
                    isVisible={showStreetView}
                    onClose={() => setShowStreetView(false)}
                    characters={gameCharacters}
                    onCharacterFound={handleCharacterFound}
                  />
                </div>
              )}
            </div>
          </div>
        </GoogleMapsLoader>

        {/* ゲーム開始モーダル */}
        {showCharacterSelector && (
          <div className="modal-overlay">
            <CharacterSelector
              onCharactersSelect={handleCharactersSelect}
              onClose={() => setShowCharacterSelector(false)}
              isVisible={showCharacterSelector}
              maxSelection={10}
              minSelection={3}
              title="ゲーム開始 - キャラクターを選択"
              description="選択したキャラクターが世界中にランダムに配置されます。ストリートビューで探して発見しよう！"
            />
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>Google Maps APIを使用した地理探索ゲームのプロトタイプ</p>
        <p>キャラクターを探して、世界を冒険しよう！</p>
      </footer>
    </div>
  );
}

export default App;
