<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * POST /api/login
     * Returns a Sanctum token (format: "id|longstring")
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();

        // OPTIONAL: enforce email verification (uncomment if your project requires it)
        // if (!$user->hasVerifiedEmail()) {
        //     return response()->json([
        //         'message' => 'Please verify your email before logging in.'
        //     ], 403);
        // }

        // ✅ Create Sanctum token (THIS is what auth:sanctum expects)
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token
        ], 200);
    }

    /**
     * POST /api/logout (optional if you have it)
     * Deletes the current access token
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }
}
