<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\VisitResource;
use App\Model\Contact;
use App\Model\Inquiry;
use App\Model\Property;
use App\Model\Visit;
use App\Order;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends ApiController
{
    /** Dashboard numbers. */
    public function summary()
    {
        $byStatus = Property::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $counts = [];
        foreach (Property::STATUS_LABELS as $code => $label) {
            $counts[$label] = (int) ($byStatus[$code] ?? 0);
        }

        return $this->success([
            'properties'        => $counts,
            'users'             => User::count(),
            'new_inquiries'     => Inquiry::where('status', 0)->count(),
            'paid_orders'       => Order::whereIn('status', Order::PAID)->count(),
            'revenue'           => (float) Order::whereIn('status', Order::PAID)->sum('amount'),
            'delivered_today'   => $this->delivered(['date' => date('Y-m-d')])->count(),
            'delivered_total_this_month' => (float) $this->delivered(['month' => date('F'), 'year' => date('Y')])->sum('total_price'),
            'alerts'            => $this->alertCounts(),
            'monthly'           => $this->monthlyPayments(6),
            'upcoming_visits'   => (new \Illuminate\Http\Resources\Json\AnonymousResourceCollection(
                Visit::with('property')->whereDate('visit_date', '>=', date('Y-m-d'))
                    ->whereIn('status', [Visit::PENDING, Visit::CONFIRMED])
                    ->orderBy('visit_date')->orderBy('visit_time')->limit(5)->get(),
                VisitResource::class
            ))->resolve(request()),
            'awaiting_review'   => $this->awaitingReview(),
            'recent_activity'   => $this->recentActivity(),
        ]);
    }

    /** Counts of things waiting for an admin: drives the sidebar badges and the bell. Open to every admin. */
    public function alerts()
    {
        return $this->success($this->alertCounts());
    }

    protected function alertCounts(): array
    {
        return [
            'pending_properties' => Property::where('status', Property::PENDING)->count(),
            'new_inquiries'      => Inquiry::where('status', 0)->count(),
            'pending_visits'     => Visit::where('status', Visit::PENDING)->count(),
            'unread_messages'    => Contact::where('status', 0)->count(),
        ];
    }

    /** Collected (paid) vs still-pending payment amounts for each of the last $months months. */
    protected function monthlyPayments(int $months): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths($months - 1);
        $series = [];
        for ($i = 0; $i < $months; $i++) {
            $m = $start->copy()->addMonths($i);
            $series[$m->format('Y-m')] = ['month' => $m->format('Y-m'), 'label' => $m->format('M'), 'collected' => 0.0, 'pending' => 0.0];
        }

        // grouped in PHP so it works on every database; the range is small
        Order::where('created_at', '>=', $start)->get(['amount', 'status', 'created_at'])->each(function ($o) use (&$series) {
            $key = optional($o->created_at)->format('Y-m');
            if (!isset($series[$key])) {
                return;
            }
            if ($o->is_paid) {
                $series[$key]['collected'] += (float) $o->amount;
            } elseif ($o->status === Order::PENDING) {
                $series[$key]['pending'] += (float) $o->amount;
            }
        });

        return array_values($series);
    }

    protected function awaitingReview(): array
    {
        return Property::where('status', Property::PENDING)->with('city')->orderBy('id', 'desc')->limit(3)->get()->map(function ($p) {
            return [
                'id'         => $p->id,
                'code'       => $p->property_code,
                'title'      => $p->name,
                'address'    => $p->address,
                'city'       => optional($p->city)->city_name,
                'price'      => (float) $p->price,
                'thumbnail'  => $p->image_one ? url($p->image_one) : null,
                'created_at' => optional($p->created_at)->toIso8601String(),
            ];
        })->all();
    }

    /** Latest events from every part of the system, newest first. */
    protected function recentActivity(): array
    {
        $items = [];
        $push = function ($type, $title, $detail, $at) use (&$items) {
            $items[] = ['type' => $type, 'title' => $title, 'detail' => $detail, 'at' => $at ? $at->toIso8601String() : null, 'ts' => $at ? $at->timestamp : 0];
        };

        Order::whereIn('status', Order::PAID)->with('user')->orderBy('id', 'desc')->limit(5)->get()->each(function ($o) use ($push) {
            $push('payment', 'Payment received' . ($o->user ? ' from ' . $o->user->name : ''), '৳ ' . number_format((float) $o->amount), $o->paid_at ?: $o->created_at);
        });
        Property::where('status', Property::PENDING)->orderBy('id', 'desc')->limit(5)->get()->each(function ($p) use ($push) {
            $push('property', 'New property submitted', $p->name . ' · ' . $p->property_code, $p->created_at);
        });
        Visit::with('property')->orderBy('id', 'desc')->limit(5)->get()->each(function ($v) use ($push) {
            $push('visit', 'Visit requested by ' . $v->name, optional($v->property)->name . ' · ' . $v->visit_date->format('d M') . ' ' . $v->visit_time, $v->created_at);
        });
        Inquiry::orderBy('id', 'desc')->limit(5)->get()->each(function ($i) use ($push) {
            $push('inquiry', 'New request from ' . $i->name, 'Property ' . $i->property_code, $i->created_at);
        });
        Contact::orderBy('id', 'desc')->limit(5)->get()->each(function ($c) use ($push) {
            $push('message', 'New message from ' . $c->name, $c->subject ?: str_limit($c->message, 50), $c->created_at);
        });

        usort($items, function ($a, $b) {
            return $b['ts'] <=> $a['ts'];
        });

        return array_map(function ($i) {
            unset($i['ts']);
            return $i;
        }, array_slice($items, 0, 8));
    }

    /**
     * Delivered properties with their total, filtered by ?date=YYYY-MM-DD, ?month=January, ?year=2026.
     */
    public function delivered(array $filters = null)
    {
        $f = $filters ?? request()->all();
        $query = Property::where('status', Property::DELIVERED)->with(['city', 'subcityModel']);

        if (!empty($f['date'])) {
            $query->where('date', date('d-m-y', strtotime($f['date'])));
        }
        if (!empty($f['month'])) {
            $query->where('month', $f['month']);
        }
        if (!empty($f['year'])) {
            $query->where('year', $f['year']);
        }

        return $query;
    }

    public function deliveredReport(Request $request)
    {
        $request->validate(['date' => 'nullable|date', 'month' => 'nullable|string|max:20', 'year' => 'nullable|digits:4']);

        $total = (float) $this->delivered($request->all())->sum('total_price');
        $page  = $this->delivered($request->all())->orderBy('id', 'desc')->paginate($this->perPage($request));

        return $this->paginated($page, PropertyResource::class, 'OK', ['sum_total_price' => $total]);
    }

    public function exportDelivered(Request $request)
    {
        $request->validate(['date' => 'nullable|date', 'month' => 'nullable|string|max:20', 'year' => 'nullable|digits:4']);
        $rows = $this->delivered($request->all())->orderBy('id')->get();

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['code', 'name', 'city', 'address', 'price', 'total_price', 'date', 'month', 'year']);
            foreach ($rows as $p) {
                fputcsv($out, [$p->property_code, $p->name, optional($p->city)->city_name, $p->address,
                    $p->price, $p->total_price, $p->date, $p->month, $p->year]);
            }
            fclose($out);
        }, 'delivered-properties.csv', ['Content-Type' => 'text/csv']);
    }
}
