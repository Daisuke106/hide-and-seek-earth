<?php

namespace App\Http\Requests\Character;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexCharacterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'difficulty' => ['nullable', Rule::in(['easy', 'medium', 'hard'])],
            'bounds' => 'nullable|array',
            'bounds.north_east' => 'required_with:bounds|array',
            'bounds.north_east.lat' => 'required_with:bounds.north_east|numeric|between:-90,90',
            'bounds.north_east.lng' => 'required_with:bounds.north_east|numeric|between:-180,180',
            'bounds.south_west' => 'required_with:bounds|array',
            'bounds.south_west.lat' => 'required_with:bounds.south_west|numeric|between:-90,90',
            'bounds.south_west.lng' => 'required_with:bounds.south_west|numeric|between:-180,180',
            'sort_by' => ['nullable', 'string'],
            'sort_order' => ['nullable', Rule::in(['asc', 'desc'])],
            'limit' => 'nullable|integer|min:1|max:100',
            'per_page' => 'nullable|integer|min:1|max:100',
        ];
    }
}
