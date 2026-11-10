<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** A contact message the admin chose to show publicly as a review. No email/phone. */
class ReviewResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'subject'    => $this->subject,
            'message'    => $this->message,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
