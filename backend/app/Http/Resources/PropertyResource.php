<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full property. Contact details are only included for the owner / admin (`with_contact`).
 */
class PropertyResource extends JsonResource
{
    public function toArray($request)
    {
        $images = array_values(array_filter([$this->image_one, $this->image_two, $this->image_three]));

        return [
            'id'              => $this->id,
            'code'            => $this->property_code,
            'title'           => $this->name,
            'status'          => (int) $this->status,
            'status_label'    => $this->status_label,
            'purpose'         => $this->purpose,
            'category'        => $this->category,
            'type'            => $this->type,
            'price'           => $this->num($this->price),
            'discount_price'  => $this->num($this->discount_price),
            'total_price'     => $this->num($this->total_price),
            'service_charge'  => $this->num($this->service_charge),
            'bedroom'         => (int) $this->bedroom,
            'bathroom'        => (int) $this->bathroom,
            'kitchen'         => (int) $this->kitchen,
            'parking'         => $this->parking === null ? null : (int) $this->parking,
            'floor'           => $this->floor,
            'area'            => $this->area,
            'address'         => $this->address,
            'details'         => $this->details,
            'video'           => $this->video,
            'map_link'        => $this->map_link,
            'latitude'        => $this->latitude === null ? null : (float) $this->latitude,
            'longitude'       => $this->longitude === null ? null : (float) $this->longitude,
            'distance_km'     => $this->when(isset($this->distance_km), function () {
                return round((float) $this->distance_km, 2);
            }),
            'city'            => new CityResource($this->whenLoaded('city')),
            'subcity'         => new SubcityResource($this->whenLoaded('subcityModel')),
            'city_id'         => $this->city_id === null ? null : (int) $this->city_id,
            'subcity_id'      => $this->subcity_id === null ? null : (int) $this->subcity_id,
            'badges'          => [
                'trend'      => (bool) $this->trend,
                'best_rated' => (bool) $this->best_rated,
                'hot_new'    => (bool) $this->hot_new,
            ],
            'thumbnail'       => $images ? url($images[0]) : null,
            'images'          => array_map('url', $images),
            'contact'         => $this->when($this->withContact($request), [
                'name'  => $this->name,
                'email' => $this->email,
                'phone' => $this->phone,
            ]),
            'user_id'         => $this->when($this->withContact($request), $this->user_id),
            'payments'        => $this->when($this->withContact($request), function () {
                return $this->paymentState();
            }),
            'created_at'      => optional($this->created_at)->toIso8601String(),
        ];
    }

    /** Listing fee: 'paid' (verified), 'verifying' (reference submitted) or null. */
    protected function paymentState(): array
    {
        $rows = \App\Order::where('property_id', $this->id)->where('purpose', 'listing')
            ->get(['purpose', 'status', 'reject_reason']);
        $state = [];
        $state['listing'] = $rows->whereIn('status', \App\Order::PAID)->count() ? 'paid'
            : ($rows->where('status', \App\Order::VERIFYING)->count() ? 'verifying' : null);
        $state['rejected_reason'] = optional($rows->where('status', \App\Order::FAILED)->last())->reject_reason;

        return $state;
    }

    protected function num($value)
    {
        return $value === null || $value === '' ? null : (float) $value;
    }

    protected function withContact($request): bool
    {
        $user = $request->user('api');
        $admin = $request->user('api-admin');

        return (bool) $admin || ($user && $user->id == $this->user_id);
    }
}
