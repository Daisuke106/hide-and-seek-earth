<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Character;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class CharacterController extends Controller
{
    /**
     * キャラクター一覧を取得
     */
    public function index(Request $request): JsonResponse
    {
        $query = Character::active();

        // 難易度フィルター
        if ($request->has('difficulty')) {
            $query->difficulty($request->difficulty);
        }

        // 境界内のキャラクターフィルター
        if ($request->has('bounds')) {
            $bounds = $request->bounds;
            if (isset($bounds['north_east']) && isset($bounds['south_west'])) {
                $query->withinBounds($bounds['north_east'], $bounds['south_west']);
            }
        }

        // 並び順
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'asc');
        
        if ($sortBy === 'random') {
            $query->inRandomOrder();
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        // ページネーションまたはリミット
        $limit = $request->get('limit');
        if ($limit) {
            $characters = $query->limit($limit)->get();
        } else {
            $characters = $query->paginate($request->get('per_page', 15));
        }

        return response()->json($characters);
    }

    /**
     * 指定されたキャラクターの詳細を取得
     */
    public function show(int $id): JsonResponse
    {
        $character = Character::active()->findOrFail($id);
        return response()->json($character);
    }

    /**
     * ランダムなキャラクターを取得
     */
    public function random(Request $request): JsonResponse
    {
        $request->validate([
            'count' => 'integer|min:1|max:50',
            'difficulty' => ['nullable', Rule::in(['easy', 'medium', 'hard'])],
        ]);

        $query = Character::active();

        if ($request->has('difficulty')) {
            $query->difficulty($request->difficulty);
        }

        $count = $request->get('count', 5);
        $characters = $query->random($count)->get();

        return response()->json($characters);
    }

    /**
     * 管理者用：新しいキャラクターを作成
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image_url' => 'nullable|url|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'difficulty' => ['required', Rule::in(['easy', 'medium', 'hard'])],
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        $character = Character::create($validated);

        return response()->json($character, 201);
    }

    /**
     * 管理者用：キャラクター情報を更新
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $character = Character::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string|max:1000',
            'image_url' => 'nullable|url|max:255',
            'latitude' => 'numeric|between:-90,90',
            'longitude' => 'numeric|between:-180,180',
            'difficulty' => [Rule::in(['easy', 'medium', 'hard'])],
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        $character->update($validated);

        return response()->json($character);
    }

    /**
     * 管理者用：キャラクターを削除（非アクティブ化）
     */
    public function destroy(int $id): JsonResponse
    {
        $character = Character::findOrFail($id);
        $character->update(['is_active' => false]);

        return response()->json(['message' => 'Character deactivated successfully']);
    }

    /**
     * キャラクターの統計情報を取得
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => Character::active()->count(),
            'by_difficulty' => [
                'easy' => Character::active()->difficulty('easy')->count(),
                'medium' => Character::active()->difficulty('medium')->count(),
                'hard' => Character::active()->difficulty('hard')->count(),
            ],
        ];

        return response()->json($stats);
    }
}
