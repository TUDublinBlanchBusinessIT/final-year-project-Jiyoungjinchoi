<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Auth\Events\Verified;

/*
|--------------------------------------------------------------------------
| Basic routes
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Email Verification Routes (REQUIRED)
|--------------------------------------------------------------------------
*/

// Email verification notice (optional web fallback)
Route::get('/email/verify', function () {
    return view('verify-email');
})->name('verification.notice');

// Handle verification link from email (SIGNED LINK)
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {

    $user = User::find($id);

    if (!$user) {
        abort(404, 'User not found.');
    }

    // Make sure hash matches email (same idea Laravel uses internally)
    if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        abort(403, 'Invalid verification link.');
    }

    // Mark verified if not already
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
>>>>>>> feature/email-verification
    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }


    // Send user back to frontend
    return redirect('http://localhost:5173/verify-email?verified=1');

})->middleware(['signed'])->name('verification.verify');

// Resend verification email (web fallback)
Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');

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

