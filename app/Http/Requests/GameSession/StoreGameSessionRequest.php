<?php

namespace App\Http\Requests\GameSession;

use Illuminate\Foundation\Http\FormRequest;

class StoreGameSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'character_ids' => 'required|array|min:1|max:10',
            'character_ids.*' => 'integer|exists:characters,id',
        ];
    }
}
