<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\AuthController;
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

// ✅ Register (User Story: Registration + Email Verification)
Route::post('/register', [RegisterController::class, 'apiStore'])
    ->middleware('throttle:10,1'); // 10 requests per minute

// ✅ Login (User Story 1337)
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:10,1'); // basic protection

// ✅ Logout (User Story 1342) - secure logout using Sanctum token
Route::middleware('auth:sanctum')->post('/logout', function (Request $request) {

    // Delete ONLY the token used for this request
    $request->user()->currentAccessToken()->delete();

    return response()->json([
        'message' => 'Logged out'
    ], 200);

});

// ✅ Resend verification email (User Story 1317)
Route::post('/email/verification-notification', function (Request $request) {

    $validated = $request->validate([
        'email' => ['required', 'email'],
    ]);

    $user = User::where('email', $validated['email'])->first();

    if (!$user) {
        return response()->json([
            'message' => 'User not found.'
        ], 404);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json([
            'message' => 'Email already verified.'
        ], 400);
    }

    // Send the verification email
    $user->sendEmailVerificationNotification();

    return response()->json([
        'message' => 'Verification email sent.'
    ], 200);

})->middleware('throttle:3,1'); // max 3 resends per minute
