<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Resources\PostResource;
use App\Model\Admin\Post;
use App\Support\ImageUploader;
use Illuminate\Http\Request;

class PostController extends AdminCrudController
{
    protected $model = Post::class;
    protected $resource = PostResource::class;
    protected $searchable = ['post_title_en', 'post_title_bn'];
    protected $with = ['category'];

    protected function rules(Request $request, $id = null): array
    {
        $req = $id ? 'sometimes|required' : 'required';

        return [
            'category_id' => "$req|integer|exists:post_category,id",
            'title_en'    => "$req|string|max:255",
            'title_bn'    => "$req|string|max:255",
            'details_en'  => "$req|string",
            'details_bn'  => "$req|string",
            'image'       => 'nullable|mimes:jpeg,jpg,png,webp,gif|max:4096',
        ];
    }

    protected function attributes(array $v): array
    {
        $map = ['title_en' => 'post_title_en', 'title_bn' => 'post_title_bn'];
        $out = [];
        foreach ($v as $key => $value) {
            if ($key !== 'image') {
                $out[$map[$key] ?? $key] = $value;
            }
        }
        if (request()->hasFile('image')) {
            $out['post_image'] = ImageUploader::save(request()->file('image'), 'post', 600, 400);
        }

        return $out;
    }

    public function destroy($id)
    {
        $post = Post::findOrFail($id);
        ImageUploader::delete($post->post_image);
        $post->delete();

        return $this->deleted();
    }
}
