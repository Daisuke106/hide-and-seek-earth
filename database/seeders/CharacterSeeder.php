<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Character;

class CharacterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $characters = [
            // 東京エリア
            [
                'name' => '東京駅の赤レンガキャラ',
                'description' => '歴史ある東京駅の赤レンガ駅舎に隠れているキャラクター。鉄道の歴史と共に歩んできた。',
                'latitude' => 35.6812362,
                'longitude' => 139.7670516,
                'difficulty' => 'easy',
                'image_url' => '/images/characters/tokyo-station.png',
                'metadata' => [
                    'landmark' => '東京駅',
                    'prefecture' => '東京都',
                    'type' => '駅舎'
                ]
            ],
            [
                'name' => '皇居の緑守りキャラ',
                'description' => '皇居東御苑の美しい庭園を守るキャラクター。四季の移ろいを愛でている。',
                'latitude' => 35.6852025,
                'longitude' => 139.7527497,
                'difficulty' => 'medium',
                'image_url' => '/images/characters/imperial-palace.png',
                'metadata' => [
                    'landmark' => '皇居',
                    'prefecture' => '東京都',
                    'type' => '庭園'
                ]
            ],
            [
                'name' => 'スカイツリーの雲上キャラ',
                'description' => '東京スカイツリーの頂上近くに住むキャラクター。東京を一望しながら風と共に舞う。',
                'latitude' => 35.7100627,
                'longitude' => 139.8107004,
                'difficulty' => 'hard',
                'image_url' => '/images/characters/skytree.png',
                'metadata' => [
                    'landmark' => '東京スカイツリー',
                    'prefecture' => '東京都',
                    'type' => 'タワー'
                ]
            ],
            [
                'name' => '浅草の雷門守キャラ',
                'description' => '浅草寺の雷門で参拝者を迎えるキャラクター。伝統と現代の架け橋となっている。',
                'latitude' => 35.7118804,
                'longitude' => 139.7965971,
                'difficulty' => 'easy',
                'image_url' => '/images/characters/sensoji.png',
                'metadata' => [
                    'landmark' => '浅草寺',
                    'prefecture' => '東京都',
                    'type' => '寺院'
                ]
            ],

            // 京都エリア
            [
                'name' => '清水寺の舞台キャラ',
                'description' => '清水寺の有名な舞台から京都を見下ろすキャラクター。桜の季節が一番好き。',
                'latitude' => 34.9949013,
                'longitude' => 135.7850535,
                'difficulty' => 'medium',
                'image_url' => '/images/characters/kiyomizu.png',
                'metadata' => [
                    'landmark' => '清水寺',
                    'prefecture' => '京都府',
                    'type' => '寺院'
                ]
            ],
            [
                'name' => '金閣寺の金輝キャラ',
                'description' => '金閣寺の金箔に輝く建物の中に隠れているキャラクター。池に映る姿も美しい。',
                'latitude' => 35.0394012,
                'longitude' => 135.7292084,
                'difficulty' => 'hard',
                'image_url' => '/images/characters/kinkaku.png',
                'metadata' => [
                    'landmark' => '金閣寺',
                    'prefecture' => '京都府',
                    'type' => '寺院'
                ]
            ],

            // 大阪エリア
            [
                'name' => '大阪城の天守閣キャラ',
                'description' => '大阪城の天守閣で大阪の街を見守るキャラクター。戦国時代からの歴史を知る。',
                'latitude' => 34.6876915,
                'longitude' => 135.5260442,
                'difficulty' => 'medium',
                'image_url' => '/images/characters/osaka-castle.png',
                'metadata' => [
                    'landmark' => '大阪城',
                    'prefecture' => '大阪府',
                    'type' => '城'
                ]
            ],

            // 横浜エリア
            [
                'name' => '赤レンガ倉庫の港キャラ',
                'description' => '横浜赤レンガ倉庫でノスタルジックな雰囲気を楽しむキャラクター。海風が心地良い。',
                'latitude' => 35.4527415,
                'longitude' => 139.6424887,
                'difficulty' => 'easy',
                'image_url' => '/images/characters/red-brick.png',
                'metadata' => [
                    'landmark' => '横浜赤レンガ倉庫',
                    'prefecture' => '神奈川県',
                    'type' => '倉庫'
                ]
            ],

            // 富士山エリア
            [
                'name' => '富士山の雲海キャラ',
                'description' => '富士山五合目で雲海を眺めるキャラクター。日本一の山からの絶景を独り占め。',
                'latitude' => 35.3606255,
                'longitude' => 138.7273634,
                'difficulty' => 'hard',
                'image_url' => '/images/characters/fuji.png',
                'metadata' => [
                    'landmark' => '富士山',
                    'prefecture' => '静岡県',
                    'type' => '山'
                ]
            ],

            // 沖縄エリア
            [
                'name' => '首里城の琉球キャラ',
                'description' => '首里城で琉球王国の歴史を語り継ぐキャラクター。独特の文化を大切にしている。',
                'latitude' => 26.2172464,
                'longitude' => 127.7187013,
                'difficulty' => 'medium',
                'image_url' => '/images/characters/shuri.png',
                'metadata' => [
                    'landmark' => '首里城',
                    'prefecture' => '沖縄県',
                    'type' => '城'
                ]
            ],

            // 海外（ボーナス）
            [
                'name' => 'エッフェル塔の鉄骨キャラ',
                'description' => 'パリのシンボル、エッフェル塔の鉄骨の間に隠れているキャラクター。ロマンチックな夜景が好き。',
                'latitude' => 48.8583701,
                'longitude' => 2.2922926,
                'difficulty' => 'hard',
                'image_url' => '/images/characters/eiffel.png',
                'metadata' => [
                    'landmark' => 'Eiffel Tower',
                    'country' => 'France',
                    'type' => 'tower'
                ]
            ],
        ];

        foreach ($characters as $character) {
            Character::create($character);
        }
    }
}
