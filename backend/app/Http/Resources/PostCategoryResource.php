<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PostCategoryResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'      => $this->id,
            'name_en' => $this->category_name_en,
            'name_bn' => $this->category_name_bn,
        ];
    }
}
