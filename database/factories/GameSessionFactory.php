<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GameSession>
 */
class GameSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startTime = $this->faker->dateTimeBetween('-1 week', 'now');
        $isCompleted = $this->faker->boolean(70); // 70% chance of being completed
        
        return [
            'character_ids' => [1, 2, 3], // Default character IDs
            'start_time' => $startTime,
            'end_time' => $isCompleted ? $this->faker->dateTimeBetween($startTime, 'now') : null,
            'found_characters' => $isCompleted ? [1, 2] : [],
            'total_score' => $isCompleted ? $this->faker->numberBetween(10, 100) : 0,
            'is_completed' => $isCompleted,
            'game_data' => [
                'difficulty_bonus' => $this->faker->numberBetween(0, 20),
                'time_bonus' => $this->faker->numberBetween(0, 10)
            ]
        ];
    }
}
