<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'         => $this->id,
            'code'       => $this->coupon,
            'discount'   => (float) $this->discount,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
