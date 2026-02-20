<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PetController;
use App\Models\User;
use App\Http\Controllers\PostController;
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

// ✅ Register
Route::post('/register', [RegisterController::class, 'apiStore'])
    ->middleware('throttle:10,1');

// ✅ Login
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:10,1');

// ✅ Resend verification email
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

    $user->sendEmailVerificationNotification();

    return response()->json(['message' => 'Verification email sent.'], 200);

})->middleware('throttle:3,1');


// ✅ Pets (Create + Read + Edit + Delete)
Route::middleware('auth:sanctum')->group(function () {

    // List logged-in user's pets (Dashboard)
    Route::get('/pets', [PetController::class, 'index']);

    // ✅ Show one pet (Edit page prefill)
    Route::get('/pets/{pet}', [PetController::class, 'show']);

    // Create pet
    Route::post('/pets', [PetController::class, 'store']);

    // ✅ Update pet (Edit save)
    Route::put('/pets/{pet}', [PetController::class, 'update']);
    Route::patch('/pets/{pet}', [PetController::class, 'update']);

    // ✅ Delete pet
    Route::delete('/pets/{pet}', [PetController::class, 'destroy']);

        // ✅ Community posts
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
});
