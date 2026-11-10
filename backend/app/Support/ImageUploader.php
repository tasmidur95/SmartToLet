<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Intervention\Image\Facades\Image;

class ImageUploader
{
    /**
     * Resize + store an uploaded image under public/ and return the path relative to the
     * project root ("public/media/..."), the same format the Blade site already stores.
     */
    public static function save(UploadedFile $file, string $folder, int $width = 1140, int $height = 702): string
    {
        $dir = public_path('media/' . trim($folder, '/'));
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $name = hexdec(uniqid()) . '.' . $file->getClientOriginalExtension();
        Image::make($file)->resize($width, $height)->save($dir . '/' . $name);

        return 'public/media/' . trim($folder, '/') . '/' . $name;
    }

    /** Delete a previously stored image (ignored when missing). */
    public static function delete(?string $path): void
    {
        if ($path && strpos($path, 'public/media/') === 0 && is_file(base_path($path))) {
            @unlink(base_path($path));
        }
    }
}
