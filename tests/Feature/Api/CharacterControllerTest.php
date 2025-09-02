<?php

namespace Tests\Feature\Api;

use App\Models\Character;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CharacterControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // データベースをクリーンな状態にする
        Character::query()->delete();
        
        // テスト用のキャラクターを作成
        Character::factory()->createMany([
            [
                'name' => 'Tokyo Station Character',
                'description' => 'A character hiding in Tokyo Station',
                'latitude' => 35.6812362,
                'longitude' => 139.7670516,
                'difficulty' => 'easy',
                'is_active' => true,
            ],
            [
                'name' => 'Skytree Character',
                'description' => 'A character at Tokyo Skytree',
                'latitude' => 35.7100627,
                'longitude' => 139.8107004,
                'difficulty' => 'hard',
                'is_active' => true,
            ],
            [
                'name' => 'Inactive Character',
                'description' => 'An inactive character',
                'latitude' => 35.6762,
                'longitude' => 139.6503,
                'difficulty' => 'medium',
                'is_active' => false,
            ]
        ]);
    }

    public function test_can_get_all_active_characters()
    {
        $response = $this->getJson('/api/characters');

        $response->assertStatus(200)
                 ->assertJsonCount(2) // アクティブなキャラクターのみ
                 ->assertJsonStructure([
                     '*' => [
                         'id',
                         'name',
                         'description',
                         'image_url',
                         'latitude',
                         'longitude',
                         'difficulty',
                         'is_active',
                         'position' => ['lat', 'lng'],
                         'created_at',
                         'updated_at'
                     ]
                 ]);
    }

    public function test_can_filter_characters_by_difficulty()
    {
        $response = $this->getJson('/api/characters?difficulty=easy');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonFragment(['difficulty' => 'easy']);
    }

    public function test_can_get_character_by_id()
    {
        $character = Character::active()->first();

        $response = $this->getJson("/api/characters/{$character->id}");

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'id' => $character->id,
                     'name' => $character->name
                 ]);
    }

    public function test_cannot_get_inactive_character_by_id()
    {
        $inactiveCharacter = Character::where('is_active', false)->first();

        $response = $this->getJson("/api/characters/{$inactiveCharacter->id}");

        $response->assertStatus(404);
    }

    public function test_can_get_random_characters()
    {
        $response = $this->getJson('/api/characters/random?count=1');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonStructure([
                     '*' => [
                         'id',
                         'name',
                         'description',
                         'difficulty',
                         'position'
                     ]
                 ]);
    }

    public function test_random_characters_respects_count_parameter()
    {
        $response = $this->getJson('/api/characters/random?count=2');

        $response->assertStatus(200)
                 ->assertJsonCount(2);
    }

    public function test_random_characters_can_filter_by_difficulty()
    {
        $response = $this->getJson('/api/characters/random?difficulty=easy&count=10');

        $response->assertStatus(200);
        
        $characters = $response->json();
        foreach ($characters as $character) {
            $this->assertEquals('easy', $character['difficulty']);
        }
    }

    public function test_can_create_character()
    {
        $characterData = [
            'name' => 'Test Character',
            'description' => 'A test character',
            'latitude' => 35.6762,
            'longitude' => 139.6503,
            'difficulty' => 'medium',
            'is_active' => true,
            'metadata' => ['test' => 'value']
        ];

        $response = $this->postJson('/api/characters', $characterData);

        $response->assertStatus(201)
                 ->assertJsonFragment([
                     'name' => 'Test Character',
                     'difficulty' => 'medium'
                 ]);

        $this->assertDatabaseHas('characters', [
            'name' => 'Test Character',
            'latitude' => 35.6762,
            'longitude' => 139.6503,
        ]);
    }

    public function test_character_creation_validates_required_fields()
    {
        $response = $this->postJson('/api/characters', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name', 'latitude', 'longitude', 'difficulty']);
    }

    public function test_character_creation_validates_coordinate_ranges()
    {
        $response = $this->postJson('/api/characters', [
            'name' => 'Test Character',
            'latitude' => 100, // Invalid latitude
            'longitude' => 200, // Invalid longitude  
            'difficulty' => 'medium'
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['latitude', 'longitude']);
    }

    public function test_character_creation_validates_difficulty_enum()
    {
        $response = $this->postJson('/api/characters', [
            'name' => 'Test Character',
            'latitude' => 35.6762,
            'longitude' => 139.6503,
            'difficulty' => 'invalid_difficulty'
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['difficulty']);
    }

    public function test_can_update_character()
    {
        $character = Character::active()->first();
        
        $updateData = [
            'name' => 'Updated Character Name',
            'difficulty' => 'hard'
        ];

        $response = $this->putJson("/api/characters/{$character->id}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'name' => 'Updated Character Name',
                     'difficulty' => 'hard'
                 ]);

        $this->assertDatabaseHas('characters', [
            'id' => $character->id,
            'name' => 'Updated Character Name',
            'difficulty' => 'hard'
        ]);
    }

    public function test_can_deactivate_character()
    {
        $character = Character::active()->first();

        $response = $this->deleteJson("/api/characters/{$character->id}");

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Character deactivated successfully']);

        $this->assertDatabaseHas('characters', [
            'id' => $character->id,
            'is_active' => false
        ]);
    }

    public function test_can_get_character_stats()
    {
        $response = $this->getJson('/api/characters/stats');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'total',
                     'by_difficulty' => [
                         'easy',
                         'medium', 
                         'hard'
                     ]
                 ])
                 ->assertJsonFragment(['total' => 2]); // アクティブなキャラクターのみ
    }

    public function test_position_attribute_is_included_in_response()
    {
        $response = $this->getJson('/api/characters');

        $response->assertStatus(200);
        
        $characters = $response->json();
        $this->assertNotEmpty($characters, 'Characters array should not be empty');
        
        foreach ($characters as $character) {
            $this->assertIsArray($character, 'Each character should be an array');
            $this->assertArrayHasKey('position', $character);
            $this->assertArrayHasKey('lat', $character['position']);
            $this->assertArrayHasKey('lng', $character['position']);
            $this->assertIsFloat($character['position']['lat']);
            $this->assertIsFloat($character['position']['lng']);
        }
    }
}