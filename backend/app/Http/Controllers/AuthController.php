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
        if (($user->is_banned ?? false) === true) {
            Auth::logout();

            return response()->json([
                'message' => 'Your account has been banned.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $rawRole = strtolower((string) ($user->role ?? ''));
        $rawAccountType = strtolower((string) ($user->account_type ?? 'basic'));

        $resolvedRole = $rawRole === 'admin' || $rawAccountType === 'admin'
            ? 'admin'
            : 'user';

        $resolvedAccountType = $rawAccountType === 'premium'
            ? 'premium'
            : 'basic';

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                ...$user->toArray(),
                'role' => $resolvedRole,
                'account_type' => $resolvedAccountType,
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