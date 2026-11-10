<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SubcityResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'      => $this->id,
            'city_id' => (int) $this->city_id,
            'name'    => $this->subcity_name,
            'city'    => new CityResource($this->whenLoaded('city')),
        ];
    }
}
