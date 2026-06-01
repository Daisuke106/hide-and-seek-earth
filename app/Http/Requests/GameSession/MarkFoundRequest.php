<?php

namespace App\Http\Requests\GameSession;

use Illuminate\Foundation\Http\FormRequest;

class MarkFoundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'character_id' => 'required|integer',
        ];
    }
}
