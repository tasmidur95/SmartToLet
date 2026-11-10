<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exceptions\ApiException;
use App\Http\Controllers\Api\V1\ApiController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

/** Database backups made by spatie/laravel-backup (stored on the local disk). */
class BackupController extends ApiController
{
    public function index()
    {
        $disk = Storage::disk('local');
        $dir  = $this->dir();

        $files = collect($disk->exists($dir) ? $disk->files($dir) : [])
            ->map(function ($path) use ($disk) {
                return [
                    'name'       => basename($path),
                    'size'       => $disk->size($path),
                    'created_at' => date('c', $disk->lastModified($path)),
                ];
            })
            ->sortByDesc('created_at')
            ->values();

        return $this->success($files);
    }

    public function run()
    {
        try {
            $code = Artisan::call('backup:run', ['--only-db' => true]);
        } catch (\Throwable $e) {
            throw new ApiException('Backup failed: ' . (config('app.debug') ? $e->getMessage() : 'see server log'), 500, 'BACKUP_FAILED');
        }
        if ($code !== 0) {
            throw new ApiException('Backup failed. Check the server log and the mysqldump setup.', 500, 'BACKUP_FAILED');
        }

        return $this->created(null, 'Backup created');
    }

    public function download($name)
    {
        return Storage::disk('local')->download($this->path($name));
    }

    public function destroy($name)
    {
        Storage::disk('local')->delete($this->path($name));

        return $this->deleted('Backup deleted');
    }

    protected function dir(): string
    {
        return config('backup.backup.name');
    }

    /** Only plain file names inside the backup folder: blocks ../ traversal. */
    protected function path($name): string
    {
        $name = basename($name);
        $path = $this->dir() . '/' . $name;
        if (!preg_match('/^[\w.\-]+\.zip$/', $name) || !Storage::disk('local')->exists($path)) {
            throw ApiException::notFound('Backup not found.');
        }

        return $path;
    }
}
