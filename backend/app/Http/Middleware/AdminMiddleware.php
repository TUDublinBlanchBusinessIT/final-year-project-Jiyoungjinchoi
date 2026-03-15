<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Check if user is logged in and is admin
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Admin access only.'
            ], 403);
        }

        return $next($request);
    }
}