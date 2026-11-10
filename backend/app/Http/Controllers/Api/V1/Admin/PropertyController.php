<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exceptions\ApiException;
use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\PropertyResource;
use App\Model\Admin\Subcity;
use App\Model\Property;
use App\Order;
use App\Support\ImageUploader;
use App\Traits\PropertyInput;
use Illuminate\Http\Request;

/**
 * Admin side of the property workflow described in Instruction.txt:
 * pending -> (edit) -> approve (published) | cancel, then delivery-progress -> delivered.
 */
class PropertyController extends ApiController
{
    use PropertyInput;

    /** action => status the property moves to */
    const TRANSITIONS = [
        'approve'           => Property::PUBLISHED,
        'cancel'            => Property::CANCELLED,
        'pending'           => Property::PENDING,
        'delivery-progress' => Property::IN_PROGRESS,
        'delivered'         => Property::DELIVERED,
    ];

    public function index(Request $request)
    {
        $request->validate(['status' => 'nullable|integer|between:0,4']);

        $query = Property::with(['city', 'subcityModel'])->filter($request->query());
        if ($request->filled('status')) {
            $query->where('status', (int) $request->query('status'));
        }

        return $this->paginated($query->paginate($this->perPage($request)), PropertyResource::class);
    }

    public function show($id)
    {
        return $this->success(Property::with(['city', 'subcityModel'])->findOrFail($id), 'OK', PropertyResource::class);
    }

    /** Admin-created listings are published straight away. */
    public function store(Request $request)
    {
        $validated = $request->validate($this->propertyRules(true) + $this->adminRules());

        $data = $this->propertyData($validated) + $this->newPropertyDefaults();
        $data['status']   = Property::PUBLISHED;
        $data['added_by'] = 'admin';
        $data['subcity']  = optional(Subcity::find($data['subcity_id']))->subcity_name;
        $data = $this->storePropertyImages($request, $data);

        return $this->created(Property::create($data)->load(['city', 'subcityModel']), 'Property created', PropertyResource::class);
    }

    public function update(Request $request, $id)
    {
        $property  = Property::findOrFail($id);
        $validated = $request->validate($this->propertyRules(false) + $this->adminRules());

        $data = $this->storePropertyImages($request, $this->propertyData($validated), $property);
        if (isset($data['subcity_id'])) {
            $data['subcity'] = optional(Subcity::find($data['subcity_id']))->subcity_name;
        }
        $property->update($data);

        return $this->success($property->fresh(['city', 'subcityModel']), 'Property updated', PropertyResource::class);
    }

    public function transition($id, $action)
    {
        if (!isset(self::TRANSITIONS[$action])) {
            throw ApiException::notFound('Unknown action.');
        }

        $property = Property::findOrFail($id);
        $status   = self::TRANSITIONS[$action];
        if ($status === Property::PUBLISHED && !Order::paidFor($property->id, 'listing')) {
            throw ApiException::conflict('The listing fee has not been paid and verified yet, so this property cannot be published.');
        }
        $update   = ['status' => $status];
        if ($status === Property::DELIVERED) {
            $update += ['date' => date('d-m-y'), 'month' => date('F'), 'year' => date('Y')];
        }
        $property->update($update);

        return $this->success($property->fresh(['city', 'subcityModel']), 'Property status updated', PropertyResource::class);
    }

    public function destroy($id)
    {
        $property = Property::findOrFail($id);
        foreach (['image_one', 'image_two', 'image_three'] as $f) {
            ImageUploader::delete($property->{$f});
        }
        $property->delete();

        return $this->deleted('Property deleted');
    }

    /** Fields only an admin may set. */
    protected function adminRules(): array
    {
        return [
            'trend'      => 'nullable|boolean',
            'best_rated' => 'nullable|boolean',
            'hot_new'    => 'nullable|boolean',
        ];
    }
}
