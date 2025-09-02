import { Character, GameSession } from '../types';

interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  rank: number;
  completedAt: string;
}

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

console.log('API Configuration:', {
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  API_URL_ENV: process.env.REACT_APP_API_URL,
});

class ApiService {
  private async fetchJson<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API Request: ${options?.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log(`API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorText = '';
        try {
          if (typeof response.text === 'function') {
            errorText = await response.text();
          }
        } catch (e) {
          // テスト環境などでresponse.textが利用できない場合
          errorText = 'Unable to read response body';
        }
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}. Response: ${errorText}`
        );
      }

      const data = await response.json();
      console.log('API Response data:', data);
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      // ネットワーク接続エラーの場合は特別な処理
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Network connection error. Make sure the backend server is running at ${API_BASE_URL}`
        );
      }
      throw error;
    }
  }

  // キャラクター関連のAPI
  async getCharacters(): Promise<Character[]> {
    const response = await this.fetchJson<{ data: Character[] } | Character[]>(
      '/characters'
    );
    // Laravelのpaginatedレスポンスかどうかをチェック
    if (
      typeof response === 'object' &&
      'data' in response &&
      Array.isArray(response.data)
    ) {
      return response.data;
    }
    // 配列が直接返ってきた場合
    return Array.isArray(response) ? response : [];
  }

  async getCharacter(id: number): Promise<Character> {
    return this.fetchJson<Character>(`/characters/${id}`);
  }

  async getRandomCharacters(count: number = 5): Promise<Character[]> {
    return this.fetchJson<Character[]>(`/characters/random?count=${count}`);
  }

  // ゲームセッション関連のAPI
  async createGameSession(characterIds: number[]): Promise<GameSession> {
    return this.fetchJson<GameSession>('/game-sessions', {
      method: 'POST',
      body: JSON.stringify({ character_ids: characterIds }),
    });
  }

  async getGameSession(sessionId: string): Promise<GameSession> {
    return this.fetchJson<GameSession>(`/game-sessions/${sessionId}`);
  }

  async updateGameSession(
    sessionId: string,
    updates: Partial<GameSession>
  ): Promise<GameSession> {
    return this.fetchJson<GameSession>(`/game-sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async markCharacterAsFound(
    sessionId: string,
    characterId: number
  ): Promise<GameSession> {
    return this.fetchJson<GameSession>(`/game-sessions/${sessionId}/found`, {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId }),
    });
  }

  async completeGameSession(sessionId: string): Promise<GameSession> {
    return this.fetchJson<GameSession>(`/game-sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  }

  // リーダーボード関連のAPI
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    return this.fetchJson<LeaderboardEntry[]>(`/leaderboard?limit=${limit}`);
  }

  // ヘルスチェック
  async healthCheck(): Promise<{ status: string }> {
    return this.fetchJson<{ status: string }>('/health');
  }
}

export const apiService = new ApiService();
