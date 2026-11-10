<?php

namespace App\Model;

use Illuminate\Database\Eloquent\Model;

/** "I'm interested" request sent from a property page (table interested_properties). */
class Inquiry extends Model
{
    protected $table = 'interested_properties';

    protected $guarded = ['id'];
}
