<?php

namespace Tests\Feature\Api;

use App\Models\Character;
use App\Models\GameSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameSessionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $characters;

    protected function setUp(): void
    {
        parent::setUp();
        
        // テスト用のキャラクターを作成
        $this->characters = Character::factory()->createMany([
            [
                'name' => 'Character 1',
                'latitude' => 35.6812362,
                'longitude' => 139.7670516,
                'difficulty' => 'easy',
                'is_active' => true,
            ],
            [
                'name' => 'Character 2',
                'latitude' => 35.7100627,
                'longitude' => 139.8107004,
                'difficulty' => 'medium',
                'is_active' => true,
            ],
            [
                'name' => 'Character 3',
                'latitude' => 35.6852025,
                'longitude' => 139.7527497,
                'difficulty' => 'hard',
                'is_active' => true,
            ]
        ]);
    }

    public function test_can_create_game_session()
    {
        $characterIds = $this->characters->take(2)->pluck('id')->toArray();

        $response = $this->postJson('/api/game-sessions', [
            'character_ids' => $characterIds
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'id',
                     'session_id',
                     'character_ids',
                     'start_time',
                     'found_characters',
                     'total_score',
                     'is_completed',
                     'characters' => [
                         '*' => [
                             'id',
                             'name',
                             'difficulty'
                         ]
                     ]
                 ]);

        $this->assertDatabaseHas('game_sessions', [
            'character_ids' => json_encode($characterIds),
            'is_completed' => false,
            'total_score' => 0
        ]);
    }

    public function test_game_session_creation_validates_character_ids()
    {
        $response = $this->postJson('/api/game-sessions', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['character_ids']);
    }

    public function test_game_session_creation_validates_character_existence()
    {
        $response = $this->postJson('/api/game-sessions', [
            'character_ids' => [999, 1000] // 存在しないID
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['character_ids.0', 'character_ids.1']);
    }

    public function test_game_session_creation_rejects_inactive_characters()
    {
        // 非アクティブなキャラクターを作成
        $inactiveCharacter = Character::factory()->create([
            'is_active' => false
        ]);

        $response = $this->postJson('/api/game-sessions', [
            'character_ids' => [$inactiveCharacter->id]
        ]);

        $response->assertStatus(422);
    }

    public function test_can_get_game_session()
    {
        $session = GameSession::factory()->create([
            'character_ids' => $this->characters->take(2)->pluck('id')->toArray(),
            'is_completed' => false,
            'found_characters' => [],
            'total_score' => 0,
            'end_time' => null
        ]);

        $response = $this->getJson("/api/game-sessions/{$session->session_id}");

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'session_id' => $session->session_id,
                     'is_completed' => false
                 ]);
    }

    public function test_can_mark_character_as_found()
    {
        $characterIds = $this->characters->take(2)->pluck('id')->toArray();
        $session = GameSession::factory()->create([
            'character_ids' => $characterIds,
            'found_characters' => [],
            'total_score' => 0
        ]);

        $characterId = $characterIds[0];

        $response = $this->postJson("/api/game-sessions/{$session->session_id}/found", [
            'character_id' => $characterId
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Character found successfully!'])
                 ->assertJsonStructure([
                     'session' => [
                         'found_characters',
                         'total_score'
                     ]
                 ]);

        $updatedSession = GameSession::find($session->id);
        $this->assertContains($characterId, $updatedSession->found_characters);
        $this->assertGreaterThan(0, $updatedSession->total_score);
    }

    public function test_cannot_mark_same_character_twice()
    {
        $characterIds = $this->characters->take(1)->pluck('id')->toArray();
        $characterId = $characterIds[0];
        
        $session = GameSession::factory()->create([
            'character_ids' => $characterIds,
            'found_characters' => [$characterId] // すでに発見済み
        ]);

        $response = $this->postJson("/api/game-sessions/{$session->session_id}/found", [
            'character_id' => $characterId
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Character already found.']);
    }

    public function test_cannot_mark_character_not_in_session()
    {
        $characterIds = $this->characters->take(1)->pluck('id')->toArray();
        $otherCharacterId = $this->characters->last()->id;
        
        $session = GameSession::factory()->create([
            'character_ids' => $characterIds
        ]);

        $response = $this->postJson("/api/game-sessions/{$session->session_id}/found", [
            'character_id' => $otherCharacterId
        ]);

        $response->assertStatus(400)
                 ->assertJsonFragment([
                     'message' => 'This character is not part of this game session.'
                 ]);
    }

    public function test_session_auto_completes_when_all_characters_found()
    {
        $characterIds = $this->characters->take(1)->pluck('id')->toArray();
        $session = GameSession::factory()->create([
            'character_ids' => $characterIds,
            'found_characters' => []
        ]);

        $response = $this->postJson("/api/game-sessions/{$session->session_id}/found", [
            'character_id' => $characterIds[0]
        ]);

        $response->assertStatus(200);

        $updatedSession = GameSession::find($session->id);
        $this->assertTrue($updatedSession->is_completed);
        $this->assertNotNull($updatedSession->end_time);
    }

    public function test_can_manually_complete_session()
    {
        $session = GameSession::factory()->create([
            'character_ids' => $this->characters->take(2)->pluck('id')->toArray(),
            'is_completed' => false
        ]);

        $response = $this->postJson("/api/game-sessions/{$session->session_id}/complete");

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Game session completed successfully!']);

        $updatedSession = GameSession::find($session->id);
        $this->assertTrue($updatedSession->is_completed);
        $this->assertNotNull($updatedSession->end_time);
    }

    public function test_cannot_complete_already_completed_session()
    {
        $session = GameSession::factory()->create([
            'is_completed' => true,
            'end_time' => now()
        ]);

        $response = $this->postJson("/api/game-sessions/{$session->session_id}/complete");

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Game session is already completed.']);
    }

    public function test_can_get_leaderboard()
    {
        // 完了済みセッションを作成
        GameSession::factory()->createMany([
            [
                'is_completed' => true,
                'total_score' => 100,
                'end_time' => now()->subMinutes(10)
            ],
            [
                'is_completed' => true,
                'total_score' => 150,
                'end_time' => now()->subMinutes(5)
            ],
            [
                'is_completed' => false, // 未完了は含まれない
                'total_score' => 200
            ]
        ]);

        $response = $this->getJson('/api/game-sessions/leaderboard');

        $response->assertStatus(200)
                 ->assertJsonCount(2) // 完了済みのみ
                 ->assertJsonStructure([
                     '*' => [
                         'session_id',
                         'total_score',
                         'start_time',
                         'end_time'
                     ]
                 ]);

        // スコアの高い順になっているかチェック
        $scores = collect($response->json())->pluck('total_score')->toArray();
        $this->assertEquals([150, 100], $scores);
    }

    public function test_can_get_game_stats()
    {
        // テスト用セッションを作成
        GameSession::factory()->createMany([
            ['is_completed' => true, 'total_score' => 100, 'found_characters' => [1, 2]],
            ['is_completed' => true, 'total_score' => 200, 'found_characters' => [1]],
            ['is_completed' => false, 'total_score' => 50, 'found_characters' => []]
        ]);

        $response = $this->getJson('/api/game-sessions/stats');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'total_sessions',
                     'active_sessions',
                     'completed_sessions',
                     'average_score',
                     'highest_score',
                     'total_characters_found'
                 ])
                 ->assertJsonFragment([
                     'total_sessions' => 3,
                     'active_sessions' => 1,
                     'completed_sessions' => 2,
                     'highest_score' => 200
                 ]);
    }

    public function test_can_delete_game_session()
    {
        $session = GameSession::factory()->create();

        $response = $this->deleteJson("/api/game-sessions/{$session->session_id}");

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Game session deleted successfully.']);

        $this->assertDatabaseMissing('game_sessions', [
            'id' => $session->id
        ]);
    }

    public function test_health_check_endpoint()
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'status',
                     'timestamp',
                     'database'
                 ])
                 ->assertJsonFragment(['status' => 'ok']);
    }

    public function test_can_filter_sessions_by_status()
    {
        GameSession::factory()->createMany([
            ['is_completed' => true],
            ['is_completed' => false],
            ['is_completed' => false]
        ]);

        // アクティブなセッションのみ
        $response = $this->getJson('/api/game-sessions?active_only=1');
        $response->assertStatus(200);
        
        $sessions = $response->json()['data'] ?? $response->json();
        $this->assertCount(2, $sessions);

        // 完了済みセッションのみ
        $response = $this->getJson('/api/game-sessions?completed_only=1');
        $response->assertStatus(200);
        
        $sessions = $response->json()['data'] ?? $response->json();
        $this->assertCount(1, $sessions);
    }
}