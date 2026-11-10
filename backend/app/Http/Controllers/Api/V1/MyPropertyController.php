<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Resources\PropertyResource;
use App\Model\Admin\Subcity;
use App\Model\Property;
use App\Support\ImageUploader;
use App\Traits\PropertyInput;
use App\Mail\invoiceMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/** Properties submitted by the logged-in user. New ones start as "pending" until an admin approves. */
class MyPropertyController extends ApiController
{
    use PropertyInput;

    public function index(Request $request)
    {
        $query = Property::with(['city', 'subcityModel'])->where('user_id', $request->user()->id)->orderBy('id', 'desc');
        if ($request->filled('status')) {
            $query->where('status', (int) $request->query('status'));
        }

        return $this->paginated($query->paginate($this->perPage($request)), PropertyResource::class);
    }

    public function show(Request $request, $id)
    {
        return $this->success($this->own($request, $id)->load(['city', 'subcityModel']), 'OK', PropertyResource::class);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->propertyRules(true));

        $data = $this->propertyData($validated) + $this->newPropertyDefaults();
        $data['user_id']  = $request->user()->id;
        $data['status']   = Property::PENDING;
        $data['added_by'] = 'user';
        $data['subcity']  = optional(Subcity::find($data['subcity_id']))->subcity_name;
        $data = $this->storePropertyImages($request, $data);

        $property = Property::create($data);

        // Confirmation mail (queued). A mail problem must never lose the submission.
        try {
            Mail::to($property->email)->queue(new invoiceMail($property->toArray()));
        } catch (\Throwable $e) {
            Log::warning('Property confirmation mail failed: ' . $e->getMessage());
        }

        return $this->created($property->load(['city', 'subcityModel']), 'Property submitted. It will be listed after admin approval.', PropertyResource::class);
    }

    public function destroy(Request $request, $id)
    {
        $property = $this->own($request, $id);
        if ((int) $property->status !== Property::PENDING) {
            throw ApiException::conflict('Only pending properties can be deleted.');
        }

        foreach (['image_one', 'image_two', 'image_three'] as $f) {
            ImageUploader::delete($property->{$f});
        }
        $property->delete();

        return $this->deleted('Property deleted');
    }

    protected function own(Request $request, $id): Property
    {
        return Property::where('user_id', $request->user()->id)->findOrFail($id);
    }
}
