<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** `details` was VARCHAR(255) but the API accepts up to 5000 characters. */
class WidenUserPropertiesDetails extends Migration
{
    public function up()
    {
        DB::statement('ALTER TABLE user_properties MODIFY details TEXT NOT NULL');
    }

    public function down()
    {
        DB::statement('ALTER TABLE user_properties MODIFY details VARCHAR(255) NOT NULL');
    }
}
