<?php

return [
    // Fee charged for a listing when the property has no service_charge of its own
    'listing_amount' => env('PAYMENT_DEFAULT_AMOUNT', 500),
];
