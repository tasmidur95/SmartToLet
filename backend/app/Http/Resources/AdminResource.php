<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AdminResource extends JsonResource
{
    const PERMISSIONS = ['places', 'coupon', 'blogs', 'all_properties', 'orders', 'reports',
                         'user_role', 'newsletter', 'contact_messages', 'site_setting', 'database_backup'];

    public function toArray($request)
    {
        $super = (string) $this->type !== '2';

        $permissions = [];
        foreach (self::PERMISSIONS as $p) {
            $permissions[$p] = $super || (string) $this->{$p} === '1';
        }

        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'email'       => $this->email,
            'phone'       => $this->phone,
            'is_super'    => $super,
            'permissions' => $permissions,
            'created_at'  => optional($this->created_at)->toIso8601String(),
        ];
    }
}
