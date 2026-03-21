<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * POST /api/login
     * Returns a Sanctum token
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

        // Block banned users
        if ($user->is_banned) {
            Auth::logout();

            return response()->json([
                'message' => 'Your account has been banned.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Use role column first, fallback to old account_type legacy data if needed
        $resolvedRole = strtolower($user->role ?? '') === 'admin'
            ? 'admin'
            : (strtolower($user->account_type ?? '') === 'admin' ? 'admin' : 'user');

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                ...$user->toArray(),
                'role' => $resolvedRole,
            ],
            'token' => $token
        ], 200);
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }
}