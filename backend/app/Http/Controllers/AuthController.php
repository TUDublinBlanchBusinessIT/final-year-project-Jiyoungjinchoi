<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // ✅ Validate required fields
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // ❌ Invalid credentials (generic message for wrong email OR wrong password)
        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        // ✅ Successful login
        $user = Auth::user();

        // Optional: remove old tokens (single-session login)
        $user->tokens()->delete();

        // Create Sanctum token
        $token = $user->createToken('pawfection_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ], 200);
    }
}
