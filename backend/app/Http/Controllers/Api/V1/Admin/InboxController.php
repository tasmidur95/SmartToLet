<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\ContactResource;
use App\Model\Contact;
use App\Model\Newsletter;
use App\Model\SiteSetting;
use Illuminate\Http\Request;

/** Contact messages / reviews, newsletter subscribers and site settings. */
class InboxController extends ApiController
{
    public function contacts(Request $request)
    {
        $query = Contact::orderBy('id', 'desc');
        if ($request->filled('is_read')) {
            $query->where('status', $request->boolean('is_read') ? 1 : 0);
        }

        return $this->paginated($query->paginate($this->perPage($request)), ContactResource::class);
    }

    public function contact($id)
    {
        return $this->success(Contact::findOrFail($id), 'OK', ContactResource::class);
    }

    /** PATCH {is_read?: bool, show_as_review?: bool} */
    public function updateContact(Request $request, $id)
    {
        $data = $request->validate(['is_read' => 'sometimes|boolean', 'show_as_review' => 'sometimes|boolean']);
        $contact = Contact::findOrFail($id);

        if (isset($data['is_read'])) {
            $contact->status = $data['is_read'] ? 1 : 0;
        }
        if (isset($data['show_as_review'])) {
            $contact->review = $data['show_as_review'] ? 1 : 0;
        }
        $contact->save();

        return $this->success($contact, 'Updated', ContactResource::class);
    }

    public function deleteContact($id)
    {
        Contact::findOrFail($id)->delete();

        return $this->deleted();
    }

    public function newsletters(Request $request)
    {
        return $this->paginated(Newsletter::orderBy('id', 'desc')->paginate($this->perPage($request)));
    }

    public function deleteNewsletter($id)
    {
        Newsletter::findOrFail($id)->delete();

        return $this->deleted();
    }

    public function settings()
    {
        return $this->success(SiteSetting::first() ?: (object) []);
    }

    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'phone_one' => 'nullable|string|max:50', 'phone_two' => 'nullable|string|max:50',
            'email_one' => 'nullable|email|max:255', 'email_two' => 'nullable|email|max:255',
            'company_name' => 'nullable|string|max:255',
            'address_one' => 'nullable|string|max:255', 'address_two' => 'nullable|string|max:255',
            'facebook' => 'nullable|string|max:255', 'linkedin' => 'nullable|string|max:255',
            'twitter' => 'nullable|string|max:255', 'youtube' => 'nullable|string|max:255',
            'instagram' => 'nullable|string|max:255', 'pinterest' => 'nullable|string|max:255',
            'whatsapp' => 'nullable|string|max:255',
            'experience' => 'nullable|string|max:50', 'project' => 'nullable|string|max:50',
            'award' => 'nullable|string|max:50', 'clients' => 'nullable|string|max:50',
        ]);

        $row = SiteSetting::first() ?: new SiteSetting();
        $row->fill($data)->save();

        return $this->success($row, 'Settings updated');
    }
}
