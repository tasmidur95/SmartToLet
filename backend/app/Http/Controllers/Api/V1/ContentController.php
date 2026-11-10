<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Resources\CouponResource;
use App\Http\Resources\PostCategoryResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\ReviewResource;
use App\Model\Admin\Coupon;
use App\Model\Admin\Post;
use App\Model\Admin\Postcategory;
use App\Model\Contact;
use App\Model\Newsletter;
use App\Model\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/** Small public endpoints: blog, site settings, newsletter, contact, coupon check. */
class ContentController extends ApiController
{
    public function posts(Request $request)
    {
        $query = Post::with('category')->orderBy('id', 'desc');
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }

        return $this->paginated($query->paginate($this->perPage($request, 6)), PostResource::class);
    }

    public function post($id)
    {
        return $this->success(Post::with('category')->findOrFail($id), 'OK', PostResource::class);
    }

    public function postCategories(Request $request)
    {
        return $this->paginated(Postcategory::orderBy('id')->paginate($this->perPage($request, 50)), PostCategoryResource::class);
    }

    /** Messages the admin marked "show as review". */
    public function reviews(Request $request)
    {
        $query = Contact::where('review', 1)->orderBy('id', 'desc');

        return $this->paginated($query->paginate($this->perPage($request, 10)), ReviewResource::class);
    }

    public function settings()
    {
        // Every page footer asks for this, so keep it for 10 minutes (cleared when an admin saves).
        $data = Cache::remember(SiteSetting::CACHE_KEY, 600, function () {
            $row = SiteSetting::first();

            return $row ? collect($row->toArray())->except(['id', 'created_at', 'updated_at'])->all() : [];
        });

        return $this->success($data ?: (object) []);
    }

    public function subscribe(Request $request)
    {
        $data = $request->validate(['email' => 'required|email|max:255']);
        Newsletter::firstOrCreate(['email' => $data['email']]);

        return $this->created(null, 'Thanks for subscribing');
    }

    public function contact(Request $request)
    {
        $data = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'phone'   => 'required|string|max:30',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        Contact::create($data + ['status' => 0, 'review' => 0, 'date' => date('d-m-y')]);

        return $this->created(null, 'Your message has been sent');
    }

    public function validateCoupon(Request $request)
    {
        $data = $request->validate(['code' => 'required|string|max:100']);

        $coupon = Coupon::where('coupon', $data['code'])->first();
        if (!$coupon) {
            throw new ApiException('Invalid coupon code.', 422, 'INVALID_COUPON');
        }

        return $this->success($coupon, 'Coupon applied', CouponResource::class);
    }
}
