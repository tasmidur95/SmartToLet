<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'          => $this->id,
            'category_id' => (int) $this->category_id,
            'category'    => new PostCategoryResource($this->whenLoaded('category')),
            'title_en'    => $this->post_title_en,
            'title_bn'    => $this->post_title_bn,
            'details_en'  => $this->details_en,
            'details_bn'  => $this->details_bn,
            'image'       => $this->post_image ? url($this->post_image) : null,
            'created_at'  => optional($this->created_at)->toIso8601String(),
        ];
    }
}
