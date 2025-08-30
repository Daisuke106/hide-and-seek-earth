<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Character extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'image_url',
        'latitude',
        'longitude',
        'difficulty',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    protected $appends = [
        'position'
    ];

    /**
     * フロントエンド用の位置情報を返す
     */
    protected function position(): Attribute
    {
        return Attribute::make(
            get: fn() => [
                'lat' => (float) $this->latitude,
                'lng' => (float) $this->longitude,
            ],
        );
    }

    /**
     * アクティブなキャラクターのスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 難易度でフィルタするスコープ
     */
    public function scopeDifficulty($query, $difficulty)
    {
        return $query->where('difficulty', $difficulty);
    }

    /**
     * 指定した範囲内のキャラクターを取得するスコープ
     */
    public function scopeWithinBounds($query, $northEast, $southWest)
    {
        return $query->whereBetween('latitude', [$southWest['lat'], $northEast['lat']])
                     ->whereBetween('longitude', [$southWest['lng'], $northEast['lng']]);
    }

    /**
     * ランダムな順序でキャラクターを取得するスコープ
     */
    public function scopeRandom($query, $count = null)
    {
        $query = $query->inRandomOrder();
        
        if ($count) {
            $query = $query->limit($count);
        }
        
        return $query;
    }
}
