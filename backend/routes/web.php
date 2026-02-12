<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Auth\Events\Verified;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Email Verification Routes (PUBLIC verification link)
|--------------------------------------------------------------------------
*/

Route::get('/email/verify', function () {
    return view('verify-email');
})->name('verification.notice');

// ✅ Public verification link (no login required)
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {

    $user = User::find($id);

    // If user not found -> invalid
    if (!$user) {
        return redirect('http://localhost:5173/verify-email?verified=0');
    }

    // If hash doesn't match -> invalid
    if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return redirect('http://localhost:5173/verify-email?verified=0');
    }

    // ✅ Mark email verified if not already
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    // ✅ Redirect to React page that shows "Verification Completed"
    return redirect('http://localhost:5173/verify-email?verified=1');

})->middleware(['signed'])->name('verification.verify');


// ✅ Resend verification email (web fallback)
Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
