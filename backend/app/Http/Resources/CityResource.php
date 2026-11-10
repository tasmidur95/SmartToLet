<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CityResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'          => $this->id,
            'name'        => $this->city_name,
            'subcities'   => SubcityResource::collection($this->whenLoaded('subcities')),
            'created_at'  => optional($this->created_at)->toIso8601String(),
        ];
    }
}
