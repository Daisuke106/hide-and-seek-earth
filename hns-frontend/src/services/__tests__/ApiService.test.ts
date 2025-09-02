import { apiService } from '../ApiService';
import { Character, GameSession } from '../../types';

// モックデータ
const mockCharacter: Character = {
  id: 1,
  name: 'Test Character',
  description: 'A test character for testing purposes',
  imageUrl: '/test-image.png',
  position: { lat: 35.6762, lng: 139.6503 },
  difficulty: 'easy',
  isFound: false,
};

const mockGameSession: GameSession = {
  id: 'test-session-id',
  characters: [mockCharacter],
  startTime: new Date(),
  foundCharacters: [],
  totalScore: 0,
  isCompleted: false,
};

// Fetch APIのモック
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ApiService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getCharacters', () => {
    it('should fetch characters successfully', async () => {
      // モックレスポンス
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCharacter],
      });

      const result = await apiService.getCharacters();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/characters',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      );
      expect(result).toEqual([mockCharacter]);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server Error',
      });

      await expect(apiService.getCharacters()).rejects.toThrow(
        'API request failed: 500 Internal Server Error'
      );
    });
  });

  describe('getRandomCharacters', () => {
    it('should fetch random characters with default count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCharacter],
      });

      const result = await apiService.getRandomCharacters();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/characters/random?count=5',
        expect.any(Object)
      );
      expect(result).toEqual([mockCharacter]);
    });

    it('should fetch random characters with custom count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCharacter],
      });

      await apiService.getRandomCharacters(3);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/characters/random?count=3',
        expect.any(Object)
      );
    });
  });

  describe('createGameSession', () => {
    it('should create game session successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameSession,
      });

      const result = await apiService.createGameSession([1, 2, 3]);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/game-sessions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ character_ids: [1, 2, 3] }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockGameSession);
    });
  });

  describe('markCharacterAsFound', () => {
    it('should mark character as found successfully', async () => {
      const updatedSession = { ...mockGameSession, foundCharacters: [1] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedSession,
      });

      const result = await apiService.markCharacterAsFound(
        'test-session-id',
        1
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/game-sessions/test-session-id/found',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ character_id: 1 }),
        })
      );
      expect(result).toEqual(updatedSession);
    });
  });

  describe('healthCheck', () => {
    it('should perform health check successfully', async () => {
      const healthResponse = { status: 'ok' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => healthResponse,
      });

      const result = await apiService.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/health',
        expect.any(Object)
      );
      expect(result).toEqual(healthResponse);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getCharacters()).rejects.toThrow('Network error');
    });

    it('should handle non-ok responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Resource not found',
      });

      await expect(apiService.getCharacters()).rejects.toThrow(
        'API request failed: 404 Not Found'
      );
    });
  });
});
