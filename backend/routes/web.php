<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Auth\Events\Verified;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Email Verification Routes (Web)
|--------------------------------------------------------------------------
| These support clicking the verification link from email in a browser.
| Since your app uses API token auth (not Laravel web sessions),
| we verify the user by {id} + {hash} in the signed URL instead of $request->user().
*/

// Email verification notice (optional web fallback)
Route::get('/email/verify', function () {
    return view('verify-email');
})->name('verification.notice');

// Handle verification link from email (works WITHOUT being logged in)
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {

    $user = User::findOrFail($id);

    // Ensure the hash matches the user's email
    if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        abort(403, 'Invalid verification link.');
    }

    // Mark as verified (only once)
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    // Redirect back to React app (show success message)
    return redirect('http://localhost:5173/login?verified=1');


})->middleware(['signed'])->name('verification.verify');

// Resend verification email (web fallback)
// This route requires a session user; if not logged in, show a helpful message instead of crashing.
Route::post('/email/verification-notification', function (Request $request) {

    if (!$request->user()) {
        return response()->json([
            'message' => 'You must be logged in to resend the verification email from this page.'
        ], 401);
    }

    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');

})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
