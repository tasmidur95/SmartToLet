<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Resources\SubcityResource;
use App\Model\Admin\Subcity;
use Illuminate\Http\Request;

class SubcityController extends AdminCrudController
{
    protected $model = Subcity::class;
    protected $resource = SubcityResource::class;
    protected $searchable = ['subcity_name'];
    protected $with = ['city'];

    protected function rules(Request $request, $id = null): array
    {
        return [
            'city_id' => 'required|integer|exists:cities,id',
            'name'    => 'required|string|max:255',
        ];
    }

    protected function attributes(array $v): array
    {
        return ['city_id' => $v['city_id'], 'subcity_name' => $v['name']];
    }
}
