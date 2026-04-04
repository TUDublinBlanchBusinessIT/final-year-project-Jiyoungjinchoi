<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StripeController extends Controller
{
    public function checkout(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        try {
            $priceId = env('STRIPE_PRICE_PREMIUM_MONTHLY');

            if (!$priceId) {
                return response()->json([
                    'message' => 'Stripe monthly price ID is missing.',
                ], 500);
            }

            $checkout = $user->newSubscription('default', $priceId)->checkout([
                'success_url' => env('FRONTEND_URL') . '/profile?payment=success',
                'cancel_url' => env('FRONTEND_URL') . '/profile?payment=cancelled',
                'metadata' => [
                    'user_id' => $user->id,
                    'plan' => 'premium_monthly',
                ],
            ]);

            return response()->json([
                'url' => $checkout->url,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to start Stripe checkout.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function billingPortal(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        try {
            if (!$user->stripe_id) {
                return response()->json([
                    'message' => 'No Stripe customer found for this account.',
                ], 400);
            }

            return response()->json([
                'url' => $user->billingPortalUrl(env('FRONTEND_URL') . '/profile'),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to open billing portal.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function cancelPremium(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        try {
            $subscription = $user->subscription('default');

            if (!$subscription) {
                return response()->json([
                    'message' => 'No active subscription found.',
                ], 404);
            }

            $subscription->cancel();

            $user->account_type = 'Basic';
            $user->subscription_status = 'cancelled';
            $user->subscription_started_at = null;
            $user->save();

            return response()->json([
                'message' => 'Subscription cancelled successfully.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Cancellation failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function subscriptionStatus(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $subscription = $user->subscription('default');
        $stripeStatus = $subscription?->stripe_status ?? 'inactive';
        $isActive = in_array($stripeStatus, ['active', 'trialing'], true);

        if ($isActive && $user->account_type !== 'Premium') {
            $user->account_type = 'Premium';
            $user->subscription_status = $stripeStatus;

            if (!$user->subscription_started_at) {
                $user->subscription_started_at = now();
            }

            $user->save();
        }

        return response()->json([
            'account_type' => $isActive ? 'Premium' : ($user->account_type ?? 'Basic'),
            'subscription_status' => $stripeStatus,
            'stripe_customer_id' => $user->stripe_id,
            'subscription_started_at' => $user->subscription_started_at,
        ]);
    }
}