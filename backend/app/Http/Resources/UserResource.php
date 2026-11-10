<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'email'             => $this->email,
            'phone'             => $this->phone,
            'email_verified_at' => optional($this->email_verified_at)->toIso8601String(),
            'created_at'        => optional($this->created_at)->toIso8601String(),
        ];
    }
}
