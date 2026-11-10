<?php

namespace App\Model\Admin;

use Illuminate\Database\Eloquent\Model;

class Wishlist extends Model
{
    protected $fillable = ['user_id', 'property_id'];
}
