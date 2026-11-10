<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\PropertyResource;
use App\Model\Property;
use Illuminate\Http\Request;

/** Public listing, search and details. Only published properties are exposed. */
class PropertyController extends ApiController
{
    public function index(Request $request)
    {
        $request->validate([
            'sort'      => 'nullable|in:latest,oldest,price_asc,price_desc',
            'badge'     => 'nullable|in:trend,best_rated,hot_new',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
        ]);

        $paginator = Property::public()
            ->with(['city', 'subcityModel'])
            ->filter($request->query())
            ->paginate($this->perPage($request, 12));

        return $this->paginated($paginator, PropertyResource::class);
    }

    /**
     * Published properties within ?radius_km (default 5) of ?lat & ?lng, nearest first.
     * Uses the Haversine formula, so it needs MySQL/MariaDB (trig functions).
     */
    public function near(Request $request)
    {
        $data = $request->validate([
            'lat'       => 'required|numeric|between:-90,90',
            'lng'       => 'required|numeric|between:-180,180',
            'radius_km' => 'nullable|numeric|min:0.1|max:200',
        ]);
        $radius = (float) ($data['radius_km'] ?? 5);

        $distance = '(6371 * acos(least(1, cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))))';
        $bind     = [$data['lat'], $data['lng'], $data['lat']];

        $paginator = Property::public()
            ->with(['city', 'subcityModel'])
            ->whereNotNull('latitude')->whereNotNull('longitude')
            ->selectRaw("user_properties.*, $distance as distance_km", $bind)
            ->whereRaw("$distance <= ?", array_merge($bind, [$radius]))
            ->orderByRaw($distance, $bind)
            ->paginate($this->perPage($request, 12));

        return $this->paginated($paginator, PropertyResource::class);
    }

    public function show($id)
    {
        $property = Property::public()->with(['city', 'subcityModel'])->findOrFail($id);

        return $this->success($property, 'OK', PropertyResource::class);
    }

    /** Other published properties in the same subcity (falls back to the same city). */
    public function nearby(Request $request, $id)
    {
        $property = Property::public()->findOrFail($id);

        $query = Property::public()->with(['city', 'subcityModel'])->where('id', '!=', $property->id);
        $property->subcity_id
            ? $query->where('subcity_id', $property->subcity_id)
            : $query->where('city_id', $property->city_id);

        return $this->paginated($query->orderBy('id', 'desc')->paginate($this->perPage($request, 6, 24)), PropertyResource::class);
    }
}
