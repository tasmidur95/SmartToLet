<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\InquiryResource;
use App\Model\Inquiry;
use Illuminate\Http\Request;

class InquiryController extends ApiController
{
    public function index(Request $request)
    {
        $query = Inquiry::orderBy('id', 'desc');
        if ($request->filled('is_read')) {
            $query->where('status', $request->boolean('is_read') ? 1 : 0);
        }

        return $this->paginated($query->paginate($this->perPage($request)), InquiryResource::class);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate(['is_read' => 'required|boolean']);
        $inquiry = Inquiry::findOrFail($id);
        $inquiry->update(['status' => $data['is_read'] ? 1 : 0]);

        return $this->success($inquiry, 'Updated', InquiryResource::class);
    }

    public function destroy($id)
    {
        Inquiry::findOrFail($id)->delete();

        return $this->deleted();
    }
}
