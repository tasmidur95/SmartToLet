<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'              => $this->id,
            'transaction_id'  => $this->transaction_id,
            'status'          => $this->status,
            'is_paid'         => $this->is_paid,
            'amount'          => $this->amount === null ? null : (float) $this->amount,
            'discount_amount' => $this->discount_amount === null ? null : (float) $this->discount_amount,
            'coupon_code'     => $this->coupon_code,
            'currency'        => $this->currency,
            'purpose'         => $this->purpose ?: 'listing',
            'method'          => $this->method_name,
            'reference'       => $this->reference,
            'sender_number'   => $this->sender_number,
            'note'            => $this->note,
            'reject_reason'   => $this->reject_reason,
            'verified_at'     => optional($this->verified_at)->toIso8601String(),
            'property_id'     => $this->property_id === null ? null : (int) $this->property_id,
            'property'        => new PropertyResource($this->whenLoaded('property')),
            'user'            => new UserResource($this->whenLoaded('user')),
            'paid_at'         => optional($this->paid_at)->toIso8601String(),
            'created_at'      => optional($this->created_at)->toIso8601String(),
        ];
    }
}
