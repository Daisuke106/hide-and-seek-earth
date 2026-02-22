import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  gameStarted?: boolean;
  gameStats?: {
    total: number;
    found: number;
    remaining: number;
    progress: number;
  };
  showHints?: boolean;
  onToggleSearch?: () => void;
  onToggleHints?: () => void;
  onToggleStreetView?: () => void;
  onStartGame?: () => void;
  canToggleStreetView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  gameStarted = false,
  gameStats,
  showHints = false,
  onToggleSearch,
  onToggleHints,
  onToggleStreetView,
  onStartGame,
  canToggleStreetView = false,
}) => {
  return (
    <header className="App-header">
      <Link to="/" className="header-title-link">
        <h1>🌍 地球全体でかくれんぼ</h1>
      </Link>

      {gameStarted && gameStats && (
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
        {onToggleSearch && (
          <button className="control-button" onClick={onToggleSearch}>
            🔍 検索
          </button>
        )}

        {!gameStarted && onStartGame && (
          <button className="control-button" onClick={onStartGame}>
            👾 ゲーム開始
          </button>
        )}

        {gameStarted && onToggleHints && (
          <button
            className="control-button"
            onClick={onToggleHints}
            style={{ backgroundColor: showHints ? '#ff4444' : undefined }}
          >
            💡 {showHints ? 'ヒント非表示' : 'ヒント表示'}
          </button>
        )}

        {onToggleStreetView && (
          <button
            className="control-button"
            onClick={onToggleStreetView}
            disabled={!canToggleStreetView}
          >
            📷 ストリートビュー
          </button>
        )}

        <Link to="/leaderboard" className="control-button nav-link">
          🏆 ランキング
        </Link>
      </div>
    </header>
  );
};
