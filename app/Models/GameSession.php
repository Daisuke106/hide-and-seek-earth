<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Str;

class GameSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'character_ids',
        'start_time',
        'end_time',
        'found_characters',
        'total_score',
        'is_completed',
        'game_data',
    ];

    protected $casts = [
        'character_ids' => 'array',
        'found_characters' => 'array',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_completed' => 'boolean',
        'game_data' => 'array',
    ];

    protected $attributes = [
        'found_characters' => '[]',
        'total_score' => 0,
        'is_completed' => false,
    ];

    protected $appends = [
        'characters'
    ];

    /**
     * モデル作成時に自動でUUIDを生成
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->session_id)) {
                $model->session_id = (string) Str::uuid();
            }
        });
    }

    /**
     * このセッションのキャラクター情報を返す
     */
    protected function characters(): Attribute
    {
        return Attribute::make(
            get: fn() => Character::whereIn('id', $this->character_ids ?? [])->get()
        );
    }

    /**
     * キャラクターを発見済みとしてマークする
     */
    public function markCharacterAsFound(int $characterId): bool
    {
        $foundCharacters = $this->found_characters ?? [];
        
        if (!in_array($characterId, $foundCharacters)) {
            $foundCharacters[] = $characterId;
            $this->found_characters = $foundCharacters;
            
            // スコアを計算（難易度に応じて）
            $character = Character::find($characterId);
            if ($character) {
                $scoreMap = [
                    'easy' => 10,
                    'medium' => 20,
                    'hard' => 30,
                ];
                $this->total_score += $scoreMap[$character->difficulty] ?? 10;
            }
            
            // 全てのキャラクターが発見されたかチェック
            if (count($foundCharacters) === count($this->character_ids ?? [])) {
                $this->is_completed = true;
                $this->end_time = now();
            }
            
            return $this->save();
        }
        
        return false;
    }

    /**
     * セッションを完了とする
     */
    public function complete(): bool
    {
        $this->is_completed = true;
        $this->end_time = now();
        
        return $this->save();
    }

    /**
     * アクティブなセッション（完了していない）のスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_completed', false);
    }

    /**
     * 完了済みセッションのスコープ
     */
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    /**
     * session_idで検索するスコープ
     */
    public function scopeBySessionId($query, $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }
}
