<?php

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Email Verification Routes (REQUIRED)
|--------------------------------------------------------------------------
*/

// Email verification notice (optional web fallback)
Route::get('/email/verify', function () {
    return view('verify-email');
})->name('verification.notice');

// Handle verification link from email
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    return redirect('http://localhost:5173/verify-email?verified=1');
})->middleware(['signed'])->name('verification.verify');

// Resend verification email (web fallback)
Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();

    return back()->with('message', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');
