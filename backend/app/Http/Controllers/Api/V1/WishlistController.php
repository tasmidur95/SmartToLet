<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\PropertyResource;
use App\Model\Admin\Wishlist;
use App\Model\Property;
use Illuminate\Http\Request;

class WishlistController extends ApiController
{
    public function index(Request $request)
    {
        $paginator = Property::public()
            ->with(['city', 'subcityModel'])
            ->whereIn('id', Wishlist::where('user_id', $request->user()->id)->pluck('property_id'))
            ->orderBy('id', 'desc')
            ->paginate($this->perPage($request));

        return $this->paginated($paginator, PropertyResource::class);
    }

    /** Idempotent: adding twice keeps one row. */
    public function add(Request $request, $propertyId)
    {
        $property = Property::public()->findOrFail($propertyId);

        Wishlist::firstOrCreate(['user_id' => $request->user()->id, 'property_id' => $property->id]);

        return $this->created(['property_id' => $property->id], 'Added to wishlist');
    }

    public function remove(Request $request, $propertyId)
    {
        Wishlist::where('user_id', $request->user()->id)->where('property_id', $propertyId)->delete();

        return $this->deleted('Removed from wishlist');
    }
}
