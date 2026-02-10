<?php

use App\Http\Controllers\Auth\RegisterController;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Basic routes
|--------------------------------------------------------------------------
*/

// Optional email verification notice page
Route::get('/email/verify', function () {
    return response()->json([
        'message' => 'Please verify your email address.',
    ]);
})->name('verification.notice');

/*
|--------------------------------------------------------------------------
| Email Verification Routes
|--------------------------------------------------------------------------
| Public signed route for React frontend
*/

// Register route
Route::post('/register', [RegisterController::class, 'store'])->name('register');

// Verification link clicked from email
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = User::find($id);

    if (! $user) {
        return redirect('http://localhost:5173/verify-email?verified=0');
    }

    if (! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
        return redirect('http://localhost:5173/verify-email?verified=0');
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new Verified($user));
    }

    return redirect('http://localhost:5173/verify-email?verified=1');
})->middleware(['signed'])->name('verification.verify');

// Resend verification email
Route::post('/email/verification-notification', function (Request $request) {
    if (! $request->user()) {
        return response()->json([
            'message' => 'Unauthenticated.',
        ], 401);
    }

    $request->user()->sendEmailVerificationNotification();

    return response()->json([
        'message' => 'Verification link sent.',
    ]);
})->middleware(['auth'])->name('verification.send');