<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| These routes are loaded by RouteServiceProvider and assigned the "api"
| middleware group. They will be available under /api/...
*/

// ✅ Health check (optional but useful)
Route::get('/health', function () {
    return response()->json(['status' => 'ok'], 200);
});

// ✅ Register (frontend POSTs to /api/register)
Route::post('/register', [RegisterController::class, 'apiStore'])
    ->middleware('throttle:10,1'); // optional protection (10 per minute)

// ✅ Resend verification email (meets User Story 1317)
Route::post('/email/verification-notification', function (Request $request) {

    $validated = $request->validate([
        'email' => ['required', 'email'],
    ]);

    $user = User::where('email', $validated['email'])->first();

    if (!$user) {
        return response()->json(['message' => 'User not found.'], 404);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email already verified.'], 400);
    }

    // Send the verification email
    $user->sendEmailVerificationNotification();

    return response()->json(['message' => 'Verification email sent.'], 200);

})->middleware('throttle:3,1'); // ✅ Rate limit: 3 requests per minute
