<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PetController extends Controller
{
    // ✅ Get all pets for the logged-in user (for Dashboard)
    public function index()
    {
        return response()->json(Auth::user()->pets, 200);
    }

    // ✅ Create a pet profile
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'breed' => 'required|string|max:255',
            'age'   => 'required|integer|min:0',

            // Photo validation (type + size)
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',

            'notes' => 'nullable|string',
        ]);

        $photoPath = null;

        // ✅ Store photo (if uploaded)
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('pets', 'public');
        }

        // ✅ Save pet linked to logged-in user
        $pet = Pet::create([
            'user_id' => Auth::id(),
            'name'    => $validated['name'],
            'breed'   => $validated['breed'],
            'age'     => $validated['age'],
            'photo'   => $photoPath,
            'notes'   => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Pet created successfully',
            'pet' => $pet
        ], 201);
    }
}
