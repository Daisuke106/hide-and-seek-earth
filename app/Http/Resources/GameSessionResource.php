<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameSessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_id' => $this->session_id,
            'character_ids' => $this->character_ids,
            'characters' => CharacterResource::collection($this->characters),
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'found_characters' => $this->found_characters,
            'total_score' => $this->total_score,
            'is_completed' => $this->is_completed,
            'game_data' => $this->game_data,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
