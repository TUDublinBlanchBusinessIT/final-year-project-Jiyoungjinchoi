<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Stripe\BillingPortal\Session as BillingPortalSession;
use Stripe\Checkout\Session as CheckoutSession;
use Stripe\Stripe;
use Stripe\Subscription as StripeSubscription;

class StripeController extends Controller
{
    private function setStripeKey(): void
    {
        $secret = config('services.stripe.secret');

        if (!$secret) {
            throw new \Exception('Stripe secret is missing from config/services.php');
        }

        Stripe::setApiKey($secret);
    }

    private function frontendUrl(): string
    {
        return rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
    }

    private function appUrl(): string
    {
        return rtrim(env('APP_URL', 'http://127.0.0.1:8000'), '/');
    }

    public function checkout(Request $request): JsonResponse
    {
        $user = $request->user();
        $priceId = config('services.stripe.price_id');

        if (!$priceId) {
            return response()->json([
                'message' => 'Stripe price ID is missing from config/services.php or .env'
            ], 500);
        }

        $this->setStripeKey();

        try {
            $payload = [
                'mode' => 'subscription',
                'line_items' => [[
                    'price' => $priceId,
                    'quantity' => 1,
                ]],
                'success_url' => $this->appUrl() . '/api/stripe/success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $this->frontendUrl() . '/payment-subscription?cancelled=1',
                'client_reference_id' => (string) $user->id,
                'metadata' => [
                    'user_id' => (string) $user->id,
                ],
            ];

            if (!empty($user->stripe_id)) {
                $payload['customer'] = $user->stripe_id;
            } else {
                $payload['customer_email'] = $user->email;
            }

            $session = CheckoutSession::create($payload);

            return response()->json([
                'url' => $session->url,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Unable to start Stripe checkout',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function success(Request $request): RedirectResponse
    {
        $sessionId = $request->query('session_id');

        if (!$sessionId) {
            return redirect($this->frontendUrl() . '/payment-subscription?error=missing-session');
        }

        $this->setStripeKey();

        try {
            $session = CheckoutSession::retrieve($sessionId);

            $userId = $session->metadata->user_id ?? $session->client_reference_id ?? null;

            if (!$userId) {
                return redirect($this->frontendUrl() . '/payment-subscription?error=no-user-id');
            }

            $user = User::find($userId);

            if (!$user) {
                return redirect($this->frontendUrl() . '/payment-subscription?error=user-not-found');
            }

            $isPaid = ($session->payment_status ?? null) === 'paid';
            $hasSubscription = !empty($session->subscription);

            if (!$isPaid && !$hasSubscription) {
                return redirect($this->frontendUrl() . '/payment-subscription?error=payment-not-complete');
            }

            $user->update([
                'account_type' => 'premium',
                'subscription_status' => 'active',
                'subscription_started_at' => now(),
                'stripe_id' => $session->customer ?: $user->stripe_id,
            ]);

            return redirect($this->frontendUrl() . '/premium-dashboard?upgraded=1');
        } catch (\Throwable $e) {
            report($e);

            return redirect($this->frontendUrl() . '/payment-subscription?error=stripe-success-failed');
        }
    }

    public function billingPortal(Request $request): JsonResponse
    {
        $user = $request->user();

        if (empty($user->stripe_id)) {
            return response()->json([
                'message' => 'No Stripe customer found for this user.'
            ], 400);
        }

        $this->setStripeKey();

        try {
            $session = BillingPortalSession::create([
                'customer' => $user->stripe_id,
                'return_url' => $this->frontendUrl() . '/payment-subscription',
            ]);

            return response()->json([
                'url' => $session->url,
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Unable to open billing portal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function cancelPremium(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->setStripeKey();

        try {
            if (!empty($user->stripe_id)) {
                $subscriptions = StripeSubscription::all([
                    'customer' => $user->stripe_id,
                    'status' => 'all',
                    'limit' => 10,
                ]);

                foreach ($subscriptions->data as $subscription) {
                    if (in_array($subscription->status, ['active', 'trialing', 'past_due'], true)) {
                        StripeSubscription::update($subscription->id, [
                            'cancel_at_period_end' => true,
                        ]);
                        break;
                    }
                }
            }

            $user->update([
                'account_type' => 'basic',
                'subscription_status' => 'cancelled',
            ]);

            return response()->json([
                'message' => 'Premium cancelled successfully.'
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Unable to cancel premium',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function subscriptionStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'account_type' => $user->account_type,
            'subscription_status' => $user->subscription_status,
            'subscription_started_at' => $user->subscription_started_at,
            'is_premium' => $user->account_type === 'premium' && $user->subscription_status === 'active',
        ]);
    }
}