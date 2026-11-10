<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class VisitResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'          => $this->id,
            'property_id' => (int) $this->property_id,
            'property'    => new PropertyResource($this->whenLoaded('property')),
            'name'        => $this->name,
            'email'       => $this->email,
            'phone'       => $this->phone,
            'visit_date'  => optional($this->visit_date)->toDateString(),
            'visit_time'  => $this->visit_time,
            'message'     => $this->message,
            'status'      => $this->status,
            'admin_note'  => $this->admin_note,
            'created_at'  => optional($this->created_at)->toIso8601String(),
        ];
    }
}
