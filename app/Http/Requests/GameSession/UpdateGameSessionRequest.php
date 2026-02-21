<?php

namespace App\Http\Requests\GameSession;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGameSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'found_characters' => 'array',
            'found_characters.*' => 'integer',
            'total_score' => 'integer|min:0',
            'is_completed' => 'boolean',
            'game_data' => 'nullable|array',
        ];
    }
}
