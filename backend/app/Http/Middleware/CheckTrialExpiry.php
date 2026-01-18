<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class CheckTrialExpiry
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->subscription_status === 'trial') {
            if ($user->trial_ends_at && $user->trial_ends_at->isPast()) {
                $user->update(['subscription_status' => 'expired']);
                
                return response()->json([
                    'message' => 'Your trial period has expired. Please subscribe to continue.',
                    'trial_expired' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}

