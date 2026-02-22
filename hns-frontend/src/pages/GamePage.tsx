import React, { useState } from 'react';
import { GameProvider } from '../contexts/GameContext';
import { MapProvider } from '../contexts/MapContext';
import { useGameState } from '../hooks/useGameState';
import { useMapState } from '../hooks/useMapState';
import { Header } from '../components/layout/Header';
import { GameMap } from '../components/GameMap';
import { StreetViewPanel } from '../components/StreetViewPanel';
import { SearchPanel } from '../components/SearchPanel';
import { CharacterSelector } from '../components/CharacterSelector';
import GoogleMapsLoader from '../components/GoogleMapsLoader';

function GamePageContent() {
  const {
    gameCharacters,
    gameStarted,
    showHints,
    gameStats,
    startGame,
    handleCharacterFound,
    toggleHints,
  } = useGameState();

  const {
    selectedPosition,
    showStreetView,
    showSearch,
    currentMap,
    handleMapClick,
    handleLocationSelect,
    handleMapReady,
    toggleSearch,
    toggleStreetView,
    setShowStreetView,
    setShowSearch,
  } = useMapState();

  const [showCharacterSelector, setShowCharacterSelector] = useState(true);

  const handleCharactersSelect = (characters: typeof gameCharacters) => {
    startGame(characters);
    setShowCharacterSelector(false);
  };

  return (
    <>
      <Header
        gameStarted={gameStarted}
        gameStats={gameStats}
        showHints={showHints}
        onToggleSearch={toggleSearch}
        onToggleHints={toggleHints}
        onToggleStreetView={toggleStreetView}
        onStartGame={() => setShowCharacterSelector(true)}
        canToggleStreetView={!!selectedPosition}
      />

      <main className="App-main">
        <GoogleMapsLoader>
          <div className="game-layout">
            <div className="map-container">
              <GameMap
                characters={gameCharacters}
                onCharacterClick={handleCharacterFound}
                onMapClick={handleMapClick}
                center={{ lat: 35.6762, lng: 139.6503 }}
                zoom={2}
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
    </>
  );
}

export const GamePage: React.FC = () => {
  return (
    <GameProvider>
      <MapProvider>
        <GamePageContent />
      </MapProvider>
    </GameProvider>
  );
};
