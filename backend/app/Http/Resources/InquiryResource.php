<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InquiryResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'email'         => $this->email,
            'phone'         => $this->phone,
            'message'       => $this->message,
            'property_code' => $this->property_code,
            'is_read'       => (int) $this->status === 1,
            'created_at'    => optional($this->created_at)->toIso8601String(),
        ];
    }
}
