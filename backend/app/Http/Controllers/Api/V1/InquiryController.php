<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\InquiryResource;
use App\Model\Inquiry;
use App\Model\Property;
use Illuminate\Http\Request;

/** "I'm interested" requests from a property page (the legacy "interested properties"/orders inbox). */
class InquiryController extends ApiController
{
    public function store(Request $request, $propertyId)
    {
        $property = Property::public()->findOrFail($propertyId);
        $data = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'phone'   => 'required|string|max:30',
            'message' => 'nullable|string|max:255',
        ]);

        Inquiry::create($data + [
            'property_code' => $property->property_code,
            'status'        => 0,
            'date'          => date('d-m-y'),
        ]);

        return $this->created(null, 'Your request has been recorded. We will contact you soon.');
    }
}
