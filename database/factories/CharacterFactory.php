<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Character>
 */
class CharacterFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $difficulties = ['easy', 'medium', 'hard'];
        
        return [
            'name' => $this->faker->name . ' Character',
            'description' => $this->faker->sentence(),
            'image_url' => '/images/characters/' . $this->faker->slug() . '.png',
            'latitude' => $this->faker->latitude(35, 36), // Tokyo area
            'longitude' => $this->faker->longitude(139, 140), // Tokyo area
            'difficulty' => $this->faker->randomElement($difficulties),
            'is_active' => true,
            'metadata' => [
                'landmark' => $this->faker->streetName(),
                'prefecture' => '東京都',
                'type' => $this->faker->randomElement(['駅', 'タワー', '寺院', '公園'])
            ]
        ];
    }
}
