import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="hero-section">
        <h2>🌍 地球全体でかくれんぼ</h2>
        <p className="hero-description">
          Google Mapsを使って世界中に隠れたキャラクターを探し出そう！
          ストリートビューで世界を冒険しながら、隠されたキャラクターを発見しよう。
        </p>
        <div className="hero-actions">
          <button
            className="start-button"
            onClick={() => navigate('/game')}
          >
            🎮 ゲームを始める
          </button>
          <button
            className="leaderboard-button"
            onClick={() => navigate('/leaderboard')}
          >
            🏆 ランキングを見る
          </button>
        </div>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <span className="feature-icon">🗺️</span>
          <h3>世界を探索</h3>
          <p>Google Mapsで世界中を自由に移動して探索しよう</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">👾</span>
          <h3>キャラクターを発見</h3>
          <p>ストリートビューで隠れたキャラクターを見つけよう</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🏆</span>
          <h3>スコアを競争</h3>
          <p>難易度に応じたスコアを獲得してランキング上位を目指そう</p>
        </div>
      </div>
    </div>
  );
};
