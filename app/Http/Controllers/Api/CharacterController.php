<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Character\IndexCharacterRequest;
use App\Http\Requests\Character\StoreCharacterRequest;
use App\Http\Requests\Character\UpdateCharacterRequest;
use App\Http\Requests\Character\RandomCharacterRequest;
use App\Http\Resources\CharacterResource;
use App\Http\Resources\CharacterCollection;
use App\Services\CharacterService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

class CharacterController extends Controller
{
    public function __construct(
        private CharacterService $characterService
    ) {}

    /**
     * キャラクター一覧を取得
     */
    public function index(IndexCharacterRequest $request): CharacterCollection|JsonResponse
    {
        $result = $this->characterService->getActiveCharacters($request->validated());

        if ($result instanceof LengthAwarePaginator) {
            return new CharacterCollection($result);
        }

        return response()->json(CharacterResource::collection($result));
    }

    /**
     * 指定されたキャラクターの詳細を取得
     */
    public function show(int $id): CharacterResource
    {
        return new CharacterResource($this->characterService->getCharacterById($id));
    }

    /**
     * ランダムなキャラクターを取得
     */
    public function random(RandomCharacterRequest $request): JsonResponse
    {
        $characters = $this->characterService->getRandomCharacters(
            $request->get('difficulty'),
            (int) $request->get('count', 5)
        );

        return response()->json(CharacterResource::collection($characters));
    }

    /**
     * 管理者用：新しいキャラクターを作成
     */
    public function store(StoreCharacterRequest $request): JsonResponse
    {
        $character = $this->characterService->createCharacter($request->validated());

        return (new CharacterResource($character))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * 管理者用：キャラクター情報を更新
     */
    public function update(UpdateCharacterRequest $request, int $id): CharacterResource
    {
        $character = $this->characterService->updateCharacter($id, $request->validated());
        return new CharacterResource($character);
    }

    /**
     * 管理者用：キャラクターを削除（非アクティブ化）
     */
    public function destroy(int $id): JsonResponse
    {
        $this->characterService->deactivateCharacter($id);
        return response()->json(['message' => 'Character deactivated successfully']);
    }

    /**
     * キャラクターの統計情報を取得
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->characterService->getStats());
    }
}
