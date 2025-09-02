<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Character;
use App\Models\GameSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class GameSessionController extends Controller
{
    /**
     * アクティブなゲームセッション一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        $query = GameSession::query();

        if ($request->get('active_only', false)) {
            $query->active();
        }

        if ($request->get('completed_only', false)) {
            $query->completed();
        }

        $sessions = $query->orderBy('start_time', 'desc')
                         ->paginate($request->get('per_page', 15));

        return response()->json($sessions);
    }

    /**
     * 新しいゲームセッションを作成
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'character_ids' => 'required|array|min:1|max:10',
            'character_ids.*' => 'integer|exists:characters,id',
        ]);

        // キャラクターが実際に存在し、アクティブかチェック
        $characters = Character::active()
                              ->whereIn('id', $validated['character_ids'])
                              ->get();

        if ($characters->count() !== count($validated['character_ids'])) {
            throw ValidationException::withMessages([
                'character_ids' => 'One or more characters are not available.'
            ]);
        }

        $session = GameSession::create([
            'character_ids' => $validated['character_ids'],
            'start_time' => now(),
            'found_characters' => [],
            'total_score' => 0,
            'is_completed' => false,
        ]);

        return response()->json($session, 201);
    }

    /**
     * 指定されたゲームセッションの詳細を取得
     */
    public function show(string $sessionId): JsonResponse
    {
        $session = GameSession::bySessionId($sessionId)->firstOrFail();
        return response()->json($session);
    }

    /**
     * ゲームセッションの状態を更新
     */
    public function update(Request $request, string $sessionId): JsonResponse
    {
        $session = GameSession::bySessionId($sessionId)->firstOrFail();

        $validated = $request->validate([
            'found_characters' => 'array',
            'found_characters.*' => 'integer',
            'total_score' => 'integer|min:0',
            'is_completed' => 'boolean',
            'game_data' => 'nullable|array',
        ]);

        $session->update($validated);

        return response()->json($session);
    }

    /**
     * キャラクターを「発見済み」としてマークする
     */
    public function markFound(Request $request, string $sessionId): JsonResponse
    {
        $session = GameSession::bySessionId($sessionId)->firstOrFail();

        $validated = $request->validate([
            'character_id' => 'required|integer',
        ]);

        $characterId = $validated['character_id'];

        // セッションに含まれるキャラクターかチェック
        if (!in_array($characterId, $session->character_ids ?? [])) {
            return response()->json([
                'message' => 'This character is not part of this game session.'
            ], 400);
        }

        // すでに発見済みかチェック
        if (in_array($characterId, $session->found_characters ?? [])) {
            return response()->json([
                'message' => 'Character already found.',
                'session' => $session
            ]);
        }

        // キャラクターを発見済みとしてマーク
        $success = $session->markCharacterAsFound($characterId);

        if ($success) {
            return response()->json([
                'message' => 'Character found successfully!',
                'session' => $session->fresh(),
                'character' => Character::find($characterId)
            ]);
        }

        return response()->json([
            'message' => 'Failed to mark character as found.'
        ], 500);
    }

    /**
     * ゲームセッションを完了する
     */
    public function complete(string $sessionId): JsonResponse
    {
        $session = GameSession::bySessionId($sessionId)->firstOrFail();

        if ($session->is_completed) {
            return response()->json([
                'message' => 'Game session is already completed.',
                'session' => $session            ]);
        }

        $session->complete();

        return response()->json([
            'message' => 'Game session completed successfully!',
            'session' => $session->fresh()
        ]);
    }

    /**
     * ゲームセッションを削除
     */
    public function destroy(string $sessionId): JsonResponse
    {
        $session = GameSession::bySessionId($sessionId)->firstOrFail();
        $session->delete();

        return response()->json(['message' => 'Game session deleted successfully.']);
    }

    /**
     * リーダーボード（上位スコア）を取得
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 10);

        $leaderboard = GameSession::completed()
                                  ->orderBy('total_score', 'desc')
                                  ->orderBy('end_time', 'asc') // 同スコアの場合は早く完了した順
                                  ->limit($limit)
                                  ->get(['session_id', 'total_score', 'start_time', 'end_time', 'character_ids']);

        return response()->json($leaderboard);
    }

    /**
     * ゲーム統計情報を取得
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_sessions' => GameSession::count(),
            'active_sessions' => GameSession::active()->count(),
            'completed_sessions' => GameSession::completed()->count(),
            'average_score' => GameSession::completed()->avg('total_score'),
            'highest_score' => GameSession::completed()->max('total_score'),
            'total_characters_found' => GameSession::completed()
                                                   ->get()
                                                   ->sum(fn($session) => count($session->found_characters ?? [])),
        ];

        return response()->json($stats);
    }

    /**
     * ヘルスチェック
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now(),
            'database' => 'connected'
        ]);
    }
}
