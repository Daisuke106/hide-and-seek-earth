import { Character, GameSession } from '../types';

interface LeaderboardEntry {
  session_id: string;
  total_score: number;
  start_time: string;
  end_time: string;
  character_ids: number[];
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

  // Laravelリソースのdataラップを解除するヘルパー
  private unwrapData<T>(response: { data: T } | T): T {
    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in (response as object) &&
      !Array.isArray(response)
    ) {
      return (response as { data: T }).data;
    }
    return response as T;
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
      Array.isArray((response as { data: Character[] }).data)
    ) {
      return (response as { data: Character[] }).data;
    }
    // 配列が直接返ってきた場合
    return Array.isArray(response) ? response : [];
  }

  async getCharacter(id: number): Promise<Character> {
    const response = await this.fetchJson<{ data: Character } | Character>(
      `/characters/${id}`
    );
    return this.unwrapData(response);
  }

  async getRandomCharacters(count: number = 5): Promise<Character[]> {
    return this.fetchJson<Character[]>(`/characters/random?count=${count}`);
  }

  // ゲームセッション関連のAPI
  async createGameSession(characterIds: number[]): Promise<GameSession> {
    const response = await this.fetchJson<{ data: GameSession } | GameSession>(
      '/game-sessions',
      {
        method: 'POST',
        body: JSON.stringify({ character_ids: characterIds }),
      }
    );
    return this.unwrapData(response);
  }

  async getGameSession(sessionId: string): Promise<GameSession> {
    const response = await this.fetchJson<{ data: GameSession } | GameSession>(
      `/game-sessions/${sessionId}`
    );
    return this.unwrapData(response);
  }

  async updateGameSession(
    sessionId: string,
    updates: Partial<GameSession>
  ): Promise<GameSession> {
    const response = await this.fetchJson<{ data: GameSession } | GameSession>(
      `/game-sessions/${sessionId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    return this.unwrapData(response);
  }

  async markCharacterAsFound(
    sessionId: string,
    characterId: number
  ): Promise<GameSession> {
    const response = await this.fetchJson<
      { message: string; session: GameSession; character: Character } | GameSession
    >(`/game-sessions/${sessionId}/found`, {
      method: 'POST',
      body: JSON.stringify({ character_id: characterId }),
    });
    // バックエンドは { message, session, character } を返す
    if (
      typeof response === 'object' &&
      response !== null &&
      'session' in (response as object)
    ) {
      return (response as { message: string; session: GameSession; character: Character }).session;
    }
    return response as GameSession;
  }

  async completeGameSession(sessionId: string): Promise<GameSession> {
    const response = await this.fetchJson<
      { message: string; session: GameSession } | GameSession
    >(`/game-sessions/${sessionId}/complete`, {
      method: 'POST',
    });
    // バックエンドは { message, session } を返す
    if (
      typeof response === 'object' &&
      response !== null &&
      'session' in (response as object)
    ) {
      return (response as { message: string; session: GameSession }).session;
    }
    return response as GameSession;
  }

  // リーダーボード関連のAPI
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    return this.fetchJson<LeaderboardEntry[]>(`/game-sessions/leaderboard?limit=${limit}`);
  }

  // ヘルスチェック
  async healthCheck(): Promise<{ status: string }> {
    return this.fetchJson<{ status: string }>('/health');
  }
}

export const apiService = new ApiService();
