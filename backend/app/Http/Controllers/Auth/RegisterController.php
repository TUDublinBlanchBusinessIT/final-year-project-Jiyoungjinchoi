<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;

class RegisterController extends Controller
{
    // 🔹 Web registration (Blade form)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

         // ✅ Send verification email
        event(new Registered($user));

        // ✅ Redirect somewhere meaningful
        return redirect()
            ->route('login')
            ->with('success', 'Registration successful. Please verify your email, then log in.');

        // ✅ Explicitly send verification email
        $user->sendEmailVerificationNotification();

        return redirect()->back()->with(
            'success',
            'Registration successful. Please verify your email.'
        );

    }

    // 🔹 API registration (React frontend)
    public function apiStore(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);


        // ✅ Send verification email
        event(new Registered($user));

        // ✅ Explicitly send verification email (THIS IS THE IMPORTANT LINE)
        $user->sendEmailVerificationNotification();


        return response()->json([
            'message' => 'Registration successful. Please verify your email.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ], 201);
    }
}
