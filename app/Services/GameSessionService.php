<?php

namespace App\Services;

use App\Exceptions\GameException;
use App\Models\Character;
use App\Models\GameSession;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class GameSessionService
{
    /**
     * セッション一覧を取得
     */
    public function getSessions(array $params): LengthAwarePaginator
    {
        $query = GameSession::query();

        if (!empty($params['active_only'])) {
            $query->active();
        }

        if (!empty($params['completed_only'])) {
            $query->completed();
        }

        return $query->orderBy('start_time', 'desc')
                     ->paginate($params['per_page'] ?? 15);
    }

    /**
     * 新しいゲームセッションを作成
     */
    public function createSession(array $characterIds): GameSession
    {
        // キャラクターが実際に存在し、アクティブかチェック
        $characters = Character::active()
                              ->whereIn('id', $characterIds)
                              ->get();

        if ($characters->count() !== \count($characterIds)) {
            throw GameException::invalidCharacters();
        }

        return GameSession::create([
            'character_ids' => $characterIds,
            'start_time' => now(),
            'found_characters' => [],
            'total_score' => 0,
            'is_completed' => false,
        ]);
    }

    /**
     * session_idでセッションを取得
     */
    public function getSessionBySessionId(string $sessionId): GameSession
    {
        return GameSession::bySessionId($sessionId)->firstOrFail();
    }

    /**
     * セッションを更新
     */
    public function updateSession(string $sessionId, array $data): GameSession
    {
        $session = $this->getSessionBySessionId($sessionId);
        $session->update($data);

        return $session;
    }

    /**
     * キャラクターを発見済みとしてマーク
     */
    public function markCharacterFound(string $sessionId, int $characterId): GameSession
    {
        $session = $this->getSessionBySessionId($sessionId);

        if (!\in_array($characterId, $session->character_ids ?? [])) {
            throw GameException::characterNotInSession();
        }

        if (\in_array($characterId, $session->found_characters ?? [])) {
            throw GameException::characterAlreadyFound();
        }

        $success = $session->markCharacterAsFound($characterId);

        if (!$success) {
            throw GameException::markFoundFailed();
        }

        return $session->fresh();
    }

    /**
     * セッションを完了
     */
    public function completeSession(string $sessionId): GameSession
    {
        $session = $this->getSessionBySessionId($sessionId);

        if ($session->is_completed) {
            throw GameException::sessionAlreadyCompleted();
        }

        $session->complete();

        return $session->fresh();
    }

    /**
     * セッションを削除
     */
    public function deleteSession(string $sessionId): void
    {
        $session = $this->getSessionBySessionId($sessionId);
        $session->delete();
    }

    /**
     * リーダーボードを取得
     */
    public function getLeaderboard(int $limit = 10): Collection
    {
        return GameSession::completed()
                          ->orderBy('total_score', 'desc')
                          ->orderBy('end_time', 'asc')
                          ->limit($limit)
                          ->get(['session_id', 'total_score', 'start_time', 'end_time', 'character_ids']);
    }

    /**
     * ゲーム統計情報を取得
     */
    public function getStats(): array
    {
        return [
            'total_sessions' => GameSession::count(),
            'active_sessions' => GameSession::active()->count(),
            'completed_sessions' => GameSession::completed()->count(),
            'average_score' => GameSession::completed()->avg('total_score'),
            'highest_score' => GameSession::completed()->max('total_score'),
            'total_characters_found' => GameSession::completed()
                                                   ->get()
                                                   ->sum(fn($session) => \count($session->found_characters ?? [])),
        ];
    }
}
