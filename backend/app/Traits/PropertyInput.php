<?php

namespace App\Traits;

use App\Model\Property;
use App\Support\ImageUploader;
use Illuminate\Http\Request;

/**
 * Validation + persistence helpers shared by the user and admin property controllers.
 */
trait PropertyInput
{
    protected function propertyRules(bool $creating = true): array
    {
        $req = $creating ? 'required' : 'sometimes';

        return [
            'city_id'        => [$req, 'integer', 'exists:cities,id'],
            'subcity_id'     => [$req, 'integer', 'exists:subcities,id'],
            'name'           => [$req, 'string', 'max:255'],
            'email'          => [$req, 'email', 'max:255'],
            'phone'          => [$req, 'string', 'max:30'],
            'address'        => [$req, 'string', 'max:255'],
            'bedroom'        => [$req, 'integer', 'min:0', 'max:50'],
            'bathroom'       => [$req, 'integer', 'min:0', 'max:50'],
            'kitchen'        => [$req, 'integer', 'min:0', 'max:50'],
            'parking'        => ['nullable', 'integer', 'min:0', 'max:50'],
            'type'           => [$req, 'string', 'max:100'],
            'category'       => [$req, 'string', 'max:100'],
            'purpose'        => [$req, 'string', 'max:100'],
            'area'           => [$req, 'string', 'max:50'],
            'floor'          => ['nullable', 'string', 'max:50'],
            'price'          => [$req, 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0'],
            'total_price'    => ['nullable', 'numeric', 'min:0'],
            'service_charge' => ['nullable', 'numeric', 'min:0'],
            'details'        => [$req, 'string', 'max:5000'],
            'video'          => ['nullable', 'string', 'max:255'],
            'latitude'       => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'      => ['nullable', 'numeric', 'between:-180,180'],
            'map_link'       => ['nullable', 'string', 'max:1000'],
            'image_one'      => [$creating ? 'required' : 'sometimes', 'mimes:jpeg,jpg,png,webp,gif', 'max:4096'],
            'image_two'      => ['sometimes', 'nullable', 'mimes:jpeg,jpg,png,webp,gif', 'max:4096'],
            'image_three'    => ['sometimes', 'nullable', 'mimes:jpeg,jpg,png,webp,gif', 'max:4096'],
        ];
    }

    /** Only the plain (non-file) property columns that were validated. */
    protected function propertyData(array $validated): array
    {
        unset($validated['image_one'], $validated['image_two'], $validated['image_three']);

        return $validated;
    }

    /** Store uploaded images onto $data (replaces old files when updating). */
    protected function storePropertyImages(Request $request, array $data, ?Property $existing = null): array
    {
        foreach (['image_one', 'image_two', 'image_three'] as $field) {
            if ($request->hasFile($field)) {
                if ($existing) {
                    ImageUploader::delete($existing->{$field});
                }
                $data[$field] = ImageUploader::save($request->file($field), 'user_property');
            } elseif (!$existing) {
                $data[$field] = ''; // legacy columns are NOT NULL
            }
        }

        return $data;
    }

    protected function newPropertyDefaults(): array
    {
        return [
            'property_code' => 'BW-' . mt_rand(100000, 999999),
            'date'          => date('d-m-y'),
            'month'         => date('F'),
            'year'          => date('Y'),
        ];
    }
}
