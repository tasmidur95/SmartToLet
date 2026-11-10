<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Resources\PostCategoryResource;
use App\Model\Admin\Postcategory;
use Illuminate\Http\Request;

class PostCategoryController extends AdminCrudController
{
    protected $model = Postcategory::class;
    protected $resource = PostCategoryResource::class;
    protected $searchable = ['category_name_en', 'category_name_bn'];

    protected function rules(Request $request, $id = null): array
    {
        return ['name_en' => 'required|string|max:255', 'name_bn' => 'required|string|max:255'];
    }

    protected function attributes(array $v): array
    {
        return ['category_name_en' => $v['name_en'], 'category_name_bn' => $v['name_bn']];
    }
}
