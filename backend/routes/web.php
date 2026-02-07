<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Auth\Events\Verified;

/*
|--------------------------------------------------------------------------
| Basic routes
|--------------------------------------------------------------------------
*/

Route::get('/register', function () {
    return view('auth.register');
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::post('/register', [RegisterController::class, 'store'])->name('register');

/*
|--------------------------------------------------------------------------
| Email Verification Routes (FIXED for React / API)
|--------------------------------------------------------------------------
| This version:
| - DOES NOT require the user to be logged in
| - Matches Laravel’s signed verification URL
| - Prevents the 500 getKey() on null error
|--------------------------------------------------------------------------
*/

// ✅ Email verification link (clicked from email)
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = User::findOrFail($id);

    // Ensure the hash matches the user's email
    if (! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
        abort(403, 'Invalid verification link.');
    }

    // Mark email as verified if not already
    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    // Redirect back to React app
    return redirect('http://localhost:5173/');
})
->middleware(['signed'])
->name('verification.verify');


// Optional: verification notice endpoint
Route::get('/email/verify', function () {
    return response()->json([
        'message' => 'Please verify your email address.'
    ]);
})->name('verification.notice');


// Optional: resend verification email (only works once auth is added)
Route::post('/email/verification-notification', function (Request $request) {
    if (! $request->user()) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    $request->user()->sendEmailVerificationNotification();

    return response()->json(['message' => 'Verification link sent.']);
})->middleware(['auth'])->name('verification.send');
