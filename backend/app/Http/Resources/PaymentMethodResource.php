<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentMethodResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'             => $this->id,
            'type'           => $this->type,
            'name'           => $this->name,
            'account_name'   => $this->account_name,
            'account_number' => $this->account_number,
            'instructions'   => $this->instructions,
            'is_active'      => (bool) $this->is_active,
        ];
    }
}
