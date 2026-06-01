import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/ApiService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import './LeaderboardPage.css';

interface LeaderboardEntry {
  session_id: string;
  total_score: number;
  start_time: string;
  end_time: string;
  character_ids: number[];
}

export const LeaderboardPage: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getLeaderboard(20);
      setEntries(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ランキングの読み込みに失敗しました'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const formatDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h2>🏆 ランキング</h2>
        <Link to="/game" className="play-button">
          🎮 ゲームをプレイ
        </Link>
      </div>

      {isLoading && <LoadingSpinner message="ランキングを読み込み中..." />}

      {error && (
        <ErrorMessage
          title="読み込みエラー"
          message={error}
          onRetry={loadLeaderboard}
        />
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="empty-state">
          <p>
            まだランキングデータがありません。ゲームをプレイしてスコアを記録しよう！
          </p>
        </div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <div className="leaderboard-table">
          <div className="table-header">
            <span className="col-rank">順位</span>
            <span className="col-score">スコア</span>
            <span className="col-characters">キャラ数</span>
            <span className="col-time">プレイ時間</span>
          </div>
          {entries.map((entry, index) => (
            <div
              key={entry.session_id}
              className={`table-row ${index < 3 ? `rank-${index + 1}` : ''}`}
            >
              <span className="col-rank">
                {index === 0
                  ? '🥇'
                  : index === 1
                    ? '🥈'
                    : index === 2
                      ? '🥉'
                      : `${index + 1}`}
              </span>
              <span className="col-score">{entry.total_score}点</span>
              <span className="col-characters">
                {entry.character_ids?.length ?? 0}体
              </span>
              <span className="col-time">
                {entry.end_time
                  ? formatDuration(entry.start_time, entry.end_time)
                  : '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
