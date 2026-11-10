<?php

use App\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates (or resets) the main admin from the environment:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' php artisan db:seed --class=AdminSeeder
 */
class AdminSeeder extends Seeder
{
    public function run()
    {
        $email    = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if (!$email || !$password || strlen($password) < 6) {
            $this->command->error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 6 characters) in .env first.');
            return;
        }

        $admin = Admin::firstOrNew(['email' => $email]);
        $admin->name = $admin->name ?: 'Administrator';
        $admin->password = Hash::make($password);
        $admin->type = null; // null = main admin, "2" = sub-admin
        $admin->save();

        $this->command->info("Main admin ready: {$email}");
    }
}
