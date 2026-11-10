<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Resources\VisitResource;
use App\Model\Property;
use App\Model\Visit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Book a visit to a property. Works for guests; a logged-in user also gets "My visits". */
class VisitController extends ApiController
{
    /** GET /visit-slots : slots on a date that are still free for a property. */
    public function slots(Request $request, $propertyId)
    {
        $request->validate(['date' => 'required|date_format:Y-m-d']);
        Property::public()->findOrFail($propertyId);

        $taken = Visit::where('property_id', $propertyId)
            ->whereDate('visit_date', $request->query('date'))
            ->whereIn('status', [Visit::PENDING, Visit::CONFIRMED])
            ->pluck('visit_time')->all();

        return $this->success([
            'date'  => $request->query('date'),
            'slots' => array_map(function ($s) use ($taken) {
                return ['time' => $s, 'available' => !in_array($s, $taken, true)];
            }, Visit::SLOTS),
        ]);
    }

    public function store(Request $request, $propertyId)
    {
        $property = Property::public()->findOrFail($propertyId);

        $data = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|max:255',
            'phone'      => 'required|string|max:30',
            'visit_date' => 'required|date_format:Y-m-d|after_or_equal:today|before_or_equal:' . date('Y-m-d', strtotime('+60 days')),
            'visit_time' => ['required', Rule::in(Visit::SLOTS)],
            'message'    => 'nullable|string|max:255',
        ]);

        // Lock the slot's rows so two simultaneous requests cannot both take it.
        $visit = DB::transaction(function () use ($property, $data, $request) {
            $taken = Visit::where('property_id', $property->id)
                ->whereDate('visit_date', $data['visit_date'])
                ->where('visit_time', $data['visit_time'])
                ->whereIn('status', [Visit::PENDING, Visit::CONFIRMED])
                ->lockForUpdate()
                ->exists();
            if ($taken) {
                throw new ApiException('That time slot is already booked. Please pick another.', 409, 'SLOT_TAKEN');
            }

            $user  = $request->user('api');
            $visit = Visit::create($data + ['property_id' => $property->id, 'user_id' => $user ? $user->id : null]);
            $visit->forceFill(['status' => Visit::PENDING])->save();

            return $visit;
        });

        return $this->created($visit->load('property'), 'Visit requested. We will confirm it shortly.', VisitResource::class);
    }

    public function mine(Request $request)
    {
        $query = Visit::with(['property.city', 'property.subcityModel'])
            ->where('user_id', $request->user()->id)->orderBy('visit_date', 'desc')->orderBy('id', 'desc');

        return $this->paginated($query->paginate($this->perPage($request)), VisitResource::class);
    }

    public function cancel(Request $request, $id)
    {
        $visit = Visit::where('user_id', $request->user()->id)->findOrFail($id);
        if (!in_array($visit->status, [Visit::PENDING, Visit::CONFIRMED], true)) {
            throw ApiException::conflict('This visit can no longer be cancelled.');
        }
        $visit->forceFill(['status' => Visit::CANCELLED])->save();

        return $this->success($visit->load('property'), 'Visit cancelled', VisitResource::class);
    }
}
