<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Resources\CityResource;
use App\Model\Admin\City;
use Illuminate\Http\Request;

class CityController extends AdminCrudController
{
    protected $model = City::class;
    protected $resource = CityResource::class;
    protected $searchable = ['city_name'];

    protected function rules(Request $request, $id = null): array
    {
        return ['name' => 'required|string|max:255|unique:cities,city_name' . ($id ? ",$id" : '')];
    }

    protected function attributes(array $v): array
    {
        return ['city_name' => $v['name']];
    }
}
