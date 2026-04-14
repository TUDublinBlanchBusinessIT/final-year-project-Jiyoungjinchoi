<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/register
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => trim($validated['first_name'] . ' ' . $validated['last_name']),
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'account_type' => 'basic',
        ]);

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user,
        ], 201);
    }

    /**
     * POST /api/login
     * Returns a Sanctum token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        $user = Auth::user();

        if (($user->is_banned ?? false) === true) {
            Auth::logout();

            return response()->json([
                'message' => 'Your account has been banned.',
            ], 403);
        }

        // Optional: enforce email verification
        // if (!$user->hasVerifiedEmail()) {
        //     Auth::logout();
        //     return response()->json([
        //         'message' => 'Please verify your email before logging in.'
        //     ], 403);
        // }

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
            'token' => $token,
        ], 200);
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ], 200);
    }
}