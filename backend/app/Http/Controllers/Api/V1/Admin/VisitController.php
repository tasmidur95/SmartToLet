<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\VisitResource;
use App\Model\Visit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VisitController extends ApiController
{
    public function index(Request $request)
    {
        $request->validate(['status' => ['nullable', Rule::in(Visit::STATUSES)], 'date' => 'nullable|date_format:Y-m-d']);

        $query = Visit::with(['property.city', 'property.subcityModel'])->orderBy('visit_date', 'desc')->orderBy('visit_time');
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('date')) {
            $query->whereDate('visit_date', $request->query('date'));
        }

        return $this->paginated($query->paginate($this->perPage($request)), VisitResource::class);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'status'     => ['sometimes', 'required', Rule::in(Visit::STATUSES)],
            'admin_note' => 'nullable|string|max:255',
        ]);

        $visit = Visit::findOrFail($id);
        $visit->forceFill($data)->save();

        return $this->success($visit->load('property'), 'Visit updated', VisitResource::class);
    }

    public function destroy($id)
    {
        Visit::findOrFail($id)->delete();

        return $this->deleted();
    }
}
