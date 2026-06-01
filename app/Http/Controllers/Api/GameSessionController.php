<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GameSession\StoreGameSessionRequest;
use App\Http\Requests\GameSession\UpdateGameSessionRequest;
use App\Http\Requests\GameSession\MarkFoundRequest;
use App\Http\Resources\CharacterResource;
use App\Http\Resources\GameSessionResource;
use App\Http\Resources\GameSessionCollection;
use App\Http\Resources\LeaderboardEntryResource;
use App\Models\Character;
use App\Services\GameSessionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GameSessionController extends Controller
{
    public function __construct(
        private GameSessionService $gameSessionService
    ) {}

    /**
     * アクティブなゲームセッション一覧を取得
     */
    public function index(Request $request): GameSessionCollection
    {
        $sessions = $this->gameSessionService->getSessions($request->all());
        return new GameSessionCollection($sessions);
    }

    /**
     * 新しいゲームセッションを作成
     */
    public function store(StoreGameSessionRequest $request): JsonResponse
    {
        $session = $this->gameSessionService->createSession($request->validated()['character_ids']);

        return (new GameSessionResource($session))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * 指定されたゲームセッションの詳細を取得
     */
    public function show(string $sessionId): GameSessionResource
    {
        return new GameSessionResource($this->gameSessionService->getSessionBySessionId($sessionId));
    }

    /**
     * ゲームセッションの状態を更新
     */
    public function update(UpdateGameSessionRequest $request, string $sessionId): GameSessionResource
    {
        $session = $this->gameSessionService->updateSession($sessionId, $request->validated());
        return new GameSessionResource($session);
    }

    /**
     * キャラクターを「発見済み」としてマークする
     */
    public function markFound(MarkFoundRequest $request, string $sessionId): JsonResponse
    {
        $characterId = $request->validated()['character_id'];
        $session = $this->gameSessionService->markCharacterFound($sessionId, $characterId);

        return response()->json([
            'message' => 'Character found successfully!',
            'session' => new GameSessionResource($session),
            'character' => new CharacterResource(Character::find($characterId))
        ]);
    }

    /**
     * ゲームセッションを完了する
     */
    public function complete(string $sessionId): JsonResponse
    {
        $session = $this->gameSessionService->completeSession($sessionId);

        return response()->json([
            'message' => 'Game session completed successfully!',
            'session' => new GameSessionResource($session)
        ]);
    }

    /**
     * ゲームセッションを削除
     */
    public function destroy(string $sessionId): JsonResponse
    {
        $this->gameSessionService->deleteSession($sessionId);
        return response()->json(['message' => 'Game session deleted successfully.']);
    }

    /**
     * リーダーボード（上位スコア）を取得
     */
    public function leaderboard(Request $request): JsonResponse
    {
        $leaderboard = $this->gameSessionService->getLeaderboard(
            (int) $request->get('limit', 10)
        );

        return response()->json(LeaderboardEntryResource::collection($leaderboard));
    }

    /**
     * ゲーム統計情報を取得
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->gameSessionService->getStats());
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
