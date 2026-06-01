<?php

namespace App\Http\Requests\Character;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RandomCharacterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'count' => 'integer|min:1|max:50',
            'difficulty' => ['nullable', Rule::in(['easy', 'medium', 'hard'])],
        ];
    }
}
