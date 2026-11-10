<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Starter data for a fresh install (8 divisions with areas, sample listings, site settings). Safe to run repeatedly. */
class DemoSeeder extends Seeder
{
    public function run()
    {
        $places = [
            'Dhaka'      => ['Mirpur', 'Dhanmondi', 'Gulshan', 'Uttara', 'Mohammadpur', 'Banani', 'Bashundhara', 'Badda'],
            'Chattogram' => ['Agrabad', 'Khulshi', 'Nasirabad', 'GEC Circle'],
            'Sylhet'     => ['Zindabazar', 'Ambarkhana', 'Subhanighat'],
            'Rajshahi'   => ['Shaheb Bazar', 'Uposhohor'],
            'Khulna'     => ['Sonadanga', 'Khalishpur'],
            'Barishal'   => ['Sagardi', 'Nathullabad'],
            'Rangpur'    => ['Jahaj Company', 'Dhap'],
            'Mymensingh' => ['Charpara', 'Ganginarpar'],
        ];

        foreach ($places as $city => $areas) {
            $cityId = DB::table('cities')->where('city_name', $city)->value('id');
            if (!$cityId) {
                $cityId = DB::table('cities')->insertGetId(['city_name' => $city, 'created_at' => now(), 'updated_at' => now()]);
            }
            foreach ($areas as $area) {
                if (!DB::table('subcities')->where('city_id', $cityId)->where('subcity_name', $area)->exists()) {
                    DB::table('subcities')->insert(['city_id' => $cityId, 'subcity_name' => $area, 'created_at' => now(), 'updated_at' => now()]);
                }
            }
        }

        // [title, city, area, category, beds, baths, price, sqft, floor, hot_new, trend, best_rated]
        $listings = [
            ['3 bed family flat near park', 'Dhaka', 'Mirpur', 'Family', 3, 2, 22000, '1250', '4th', 1, 0, 0],
            ['Sunny 2 bed apartment', 'Dhaka', 'Dhanmondi', 'Family', 2, 2, 28000, '1050', '5th', 0, 1, 0],
            ['Luxury 4 bed flat with lake view', 'Dhaka', 'Gulshan', 'Family', 4, 4, 85000, '2400', '7th', 1, 0, 1],
            ['Bachelor seat in shared flat', 'Dhaka', 'Mohammadpur', 'Bachelor', 1, 1, 5500, '180', '3rd', 0, 1, 0],
            ['Single room for students', 'Dhaka', 'Uttara', 'Bachelor', 1, 1, 7000, '220', '2nd', 1, 0, 0],
            ['Furnished office space', 'Dhaka', 'Banani', 'Office', 0, 2, 60000, '1800', '6th', 0, 0, 1],
            ['Street-front shop', 'Dhaka', 'Badda', 'Shop', 0, 1, 35000, '400', 'Ground', 0, 1, 0],
            ['3 bed flat in Bashundhara R/A', 'Dhaka', 'Bashundhara', 'Family', 3, 3, 32000, '1450', '8th', 1, 0, 1],
            ['Family flat near Agrabad', 'Chattogram', 'Agrabad', 'Family', 3, 2, 20000, '1200', '3rd', 0, 1, 0],
            ['Hillside 2 bed apartment', 'Chattogram', 'Khulshi', 'Family', 2, 2, 24000, '1000', '5th', 1, 0, 0],
            ['Bachelor mess room', 'Chattogram', 'GEC Circle', 'Bachelor', 1, 1, 4500, '160', '2nd', 0, 0, 1],
            ['Office floor in city centre', 'Sylhet', 'Zindabazar', 'Office', 0, 2, 40000, '1500', '4th', 0, 1, 0],
            ['Spacious 3 bed flat', 'Sylhet', 'Ambarkhana', 'Family', 3, 2, 18000, '1300', '2nd', 1, 0, 0],
            ['2 bed family flat', 'Rajshahi', 'Shaheb Bazar', 'Family', 2, 1, 12000, '950', '3rd', 0, 0, 1],
            ['Shop at main road', 'Khulna', 'Sonadanga', 'Shop', 0, 1, 25000, '350', 'Ground', 0, 1, 0],
            ['Quiet 2 bed flat', 'Rangpur', 'Dhap', 'Family', 2, 2, 10000, '900', '2nd', 1, 0, 0],
        ];

        foreach ($listings as $i => $l) {
            $code = 'DEMO' . str_pad($i + 1, 3, '0', STR_PAD_LEFT);
            if (DB::table('user_properties')->where('property_code', $code)->exists()) {
                continue;
            }
            $cityId = DB::table('cities')->where('city_name', $l[1])->value('id');
            $subId = DB::table('subcities')->where('city_id', $cityId)->where('subcity_name', $l[2])->value('id');
            DB::table('user_properties')->insert([
                'city_id' => $cityId, 'subcity_id' => $subId, 'name' => $l[0], 'email' => 'owner@example.com',
                'phone' => '+880 1700-000000', 'address' => $l[2] . ', ' . $l[1], 'subcity' => $l[2],
                'bedroom' => $l[4], 'bathroom' => $l[5], 'kitchen' => 1, 'parking' => 0, 'type' => $l[3] === 'Family' ? 'Flat' : $l[3],
                'area' => $l[7], 'price' => $l[6], 'total_price' => $l[6], 'category' => $l[3], 'floor' => $l[8],
                'details' => 'Sample listing: well-lit, good ventilation, 24/7 water and gas, close to shops and transport.',
                'purpose' => 'Rent', 'image_one' => '', 'image_two' => '', 'image_three' => '', 'status' => 1,
                'property_code' => $code, 'hot_new' => $l[9], 'trend' => $l[10], 'best_rated' => $l[11],
                'added_by' => 'seeder', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }


        if (!DB::table('sitesetting')->exists()) {
            DB::table('sitesetting')->insert([
                'company_name' => 'Smart Tolet', 'email_one' => 'hello@example.com', 'phone_one' => '+880 1700-000000',
                'address_one' => 'Dhaka, Bangladesh', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }
}
