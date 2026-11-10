<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponder;

abstract class ApiController extends Controller
{
    use ApiResponder;
}
