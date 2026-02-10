<?php

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Email Verification Routes (REQUIRED)
|--------------------------------------------------------------------------
*/

// Email verification notice (optional web fallback)
Route::get('/email/verify', function () {
    return view('verify-email');
})->name('verification.notice');

// Handle verification link from email (PUBLIC route)
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {

    // ✅ Find the user safely (prevents getKey() on null)
    $user = User::find($id);

    // If user not found -> invalid
    if (!$user) {
        return redirect('http://localhost:5173/verify-email?verified=0');
    }

    // If hash doesn't match -> invalid
    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return redirect('http://localhost:5173/verify-email?verified=0');
    }

    // ✅ Mark email as verified if not already
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    // ✅ Redirect to React popup page
    return redirect('http://localhost:5173/verify-email?verified=1');

})->middleware(['signed'])->name('verification.verify');


// Resend verification email (web fallback)
Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
