<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PetController;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| These routes are loaded by RouteServiceProvider and assigned the "api"
| middleware group. They will be available under /api/...
*/

// ✅ Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok'], 200);
});

// ✅ Register (User Story: Registration + Email Verification)
Route::post('/register', [RegisterController::class, 'apiStore'])
    ->middleware('throttle:10,1');

// ✅ Login (User Story 1337)
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:10,1');

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

    $user->sendEmailVerificationNotification();

    return response()->json([
        'message' => 'Verification email sent.'
    ], 200);

})->middleware('throttle:3,1');


// ✅ Pets (User Story 1506 - Create Pet Profile)
Route::middleware('auth:sanctum')->group(function () {

    // Get logged-in user's pets (for dashboard)
    Route::get('/pets', [PetController::class, 'index']);

    // Create a new pet profile
    Route::post('/pets', [PetController::class, 'store']);
});
