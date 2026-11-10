<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ContactResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'phone'      => $this->phone,
            'subject'    => $this->subject,
            'message'    => $this->message,
            'is_read'    => (int) $this->status === 1,
            'show_as_review' => (int) $this->review === 1,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
