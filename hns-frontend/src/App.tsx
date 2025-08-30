import React, { useState, useCallback } from 'react';
import { Character } from './types';
import { GameMap } from './components/GameMap';
import { StreetViewPanel } from './components/StreetViewPanel';
import { SearchPanel } from './components/SearchPanel';
import { CharacterSelector } from './components/CharacterSelector';
import GoogleMapsLoader from './components/GoogleMapsLoader';
import './App.css';

function App() {
  const [gameCharacters, setGameCharacters] = useState<Character[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [showStreetView, setShowStreetView] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(true);
  const [currentMap, setCurrentMap] = useState<google.maps.Map | null>(null);

  const handleCharactersSelect = useCallback((characters: Character[]) => {
    setGameCharacters(characters);
    setShowCharacterSelector(false);
  }, []);

  const handleCharacterClick = useCallback((character: Character) => {
    console.log('Character clicked:', character);
    // ここで「発見！」のロジックを実装
    alert(`${character.name}を発見しました！`);
  }, []);

  const handleMapClick = useCallback((position: google.maps.LatLngLiteral) => {
    setSelectedPosition(position);
    setShowStreetView(true);
  }, []);

  const handleLocationSelect = useCallback((position: google.maps.LatLngLiteral) => {
    // 検索で選択した場合はマップを中心に移動し、ストリートビューは表示しない
    if (currentMap) {
      currentMap.setCenter(position);
      currentMap.setZoom(15); // ズームレベルを上げて詳細表示
    }
    setSelectedPosition(position);
    setShowSearch(false);
    // ストリートビューは表示しない
  }, [currentMap]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    setCurrentMap(map);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌍 地球全体でかくれんぼ</h1>
        <div className="header-controls">
          <button
            className="control-button"
            onClick={() => setShowSearch(!showSearch)}
          >
            🔍 検索
          </button>
          <button
            className="control-button"
            onClick={() => setShowCharacterSelector(true)}
          >
            👾 キャラクター選択
          </button>
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
                onCharacterClick={handleCharacterClick}
                onMapClick={handleMapClick}
                center={{ lat: 35.6762, lng: 139.6503 }} // Tokyo
                zoom={10}
                onMapReady={handleMapReady}
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
                  onCharacterFound={handleCharacterClick}
                />
              </div>
            )}
          </div>
          </div>
        </GoogleMapsLoader>

        {/* モーダル */}
        {showCharacterSelector && (
          <div className="modal-overlay">
            <CharacterSelector
              onCharactersSelect={handleCharactersSelect}
              onClose={() => setShowCharacterSelector(false)}
              isVisible={showCharacterSelector}
              maxSelection={5}
              minSelection={1}
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
