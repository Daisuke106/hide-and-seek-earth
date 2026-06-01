<?php

namespace App\Http\Requests\Character;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCharacterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'string|max:255',
            'description' => 'nullable|string|max:1000',
            'image_url' => 'nullable|url|max:255',
            'latitude' => 'numeric|between:-90,90',
            'longitude' => 'numeric|between:-180,180',
            'difficulty' => [Rule::in(['easy', 'medium', 'hard'])],
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ];
    }
}
