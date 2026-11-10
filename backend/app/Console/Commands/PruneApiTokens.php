<?php

namespace App\Console\Commands;

use App\Model\ApiToken;
use Illuminate\Console\Command;

class PruneApiTokens extends Command
{
    protected $signature = 'tokens:prune';
    protected $description = 'Delete expired API tokens';

    public function handle()
    {
        $count = ApiToken::whereNotNull('expires_at')->where('expires_at', '<', now())->delete();
        $this->info("Deleted {$count} expired token(s).");
    }
}
