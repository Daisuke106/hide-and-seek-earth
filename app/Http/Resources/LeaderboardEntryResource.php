<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaderboardEntryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'session_id' => $this->session_id,
            'total_score' => $this->total_score,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'character_ids' => $this->character_ids,
        ];
    }
}
