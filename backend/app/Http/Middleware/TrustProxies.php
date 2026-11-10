<?php

namespace App\Http\Middleware;

use Fideloper\Proxy\TrustProxies as Middleware;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Http\Request;

class TrustProxies extends Middleware
{
    /**
     * The trusted proxies for this application.
     *
     * @var array|string
     */
    protected $proxies;

    /**
     * The headers that should be used to detect proxies.
     *
     * @var int
     */
    protected $headers = Request::HEADER_X_FORWARDED_ALL;

    /** TRUSTED_PROXIES=* (Docker/ngrok) or a comma separated list of proxy IPs. */
    public function __construct(Repository $config)
    {
        parent::__construct($config);

        if ($list = env('TRUSTED_PROXIES')) {
            $this->proxies = $list === '*' ? '*' : array_map('trim', explode(',', $list));
        }
    }
}
