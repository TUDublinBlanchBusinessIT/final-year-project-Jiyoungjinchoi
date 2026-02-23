<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Auth\Events\Verified;

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