<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\CityResource;
use App\Http\Resources\SubcityResource;
use App\Model\Admin\City;
use App\Model\Admin\Subcity;
use Illuminate\Http\Request;

class LocationController extends ApiController
{
    public function cities(Request $request)
    {
        $query = City::orderBy('city_name');
        if ($request->boolean('with_subcities')) {
            $query->with('subcities');
        }

        return $this->paginated($query->paginate($this->perPage($request, 50)), CityResource::class);
    }

    public function city($id)
    {
        return $this->success(City::with('subcities')->findOrFail($id), 'OK', CityResource::class);
    }

    public function subcities(Request $request)
    {
        $query = Subcity::orderBy('subcity_name');
        if ($request->filled('city_id')) {
            $query->where('city_id', $request->query('city_id'));
        }

        return $this->paginated($query->paginate($this->perPage($request, 50)), SubcityResource::class);
    }
}
