<?php

namespace App\Services;

use App\Models\Character;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class CharacterService
{
    /**
     * フィルター・ソート・ページネーション付きでアクティブなキャラクターを取得
     */
    public function getActiveCharacters(array $params): Collection|LengthAwarePaginator
    {
        $query = Character::active();

        if (!empty($params['difficulty'])) {
            $query->difficulty($params['difficulty']);
        }

        if (!empty($params['bounds'])) {
            $bounds = $params['bounds'];
            if (isset($bounds['north_east'], $bounds['south_west'])) {
                $query->withinBounds($bounds['north_east'], $bounds['south_west']);
            }
        }

        $sortBy = $params['sort_by'] ?? 'id';
        $sortOrder = $params['sort_order'] ?? 'asc';

        if ($sortBy === 'random') {
            $query->inRandomOrder();
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        if (!empty($params['limit'])) {
            return $query->limit($params['limit'])->get();
        }

        return $query->paginate($params['per_page'] ?? 15);
    }

    /**
     * IDでアクティブなキャラクターを取得
     */
    public function getCharacterById(int $id): Character
    {
        return Character::active()->findOrFail($id);
    }

    /**
     * ランダムなキャラクターを取得
     */
    public function getRandomCharacters(?string $difficulty, int $count = 5): Collection
    {
        $query = Character::active();

        if ($difficulty) {
            $query->difficulty($difficulty);
        }

        return $query->random($count)->get();
    }

    /**
     * キャラクターを作成
     */
    public function createCharacter(array $data): Character
    {
        return Character::create($data);
    }

    /**
     * キャラクターを更新
     */
    public function updateCharacter(int $id, array $data): Character
    {
        $character = Character::findOrFail($id);
        $character->update($data);

        return $character;
    }

    /**
     * キャラクターを非アクティブ化
     */
    public function deactivateCharacter(int $id): void
    {
        $character = Character::findOrFail($id);
        $character->update(['is_active' => false]);
    }

    /**
     * キャラクターの統計情報を取得
     */
    public function getStats(): array
    {
        return [
            'total' => Character::active()->count(),
            'by_difficulty' => [
                'easy' => Character::active()->difficulty('easy')->count(),
                'medium' => Character::active()->difficulty('medium')->count(),
                'hard' => Character::active()->difficulty('hard')->count(),
            ],
        ];
    }
}
