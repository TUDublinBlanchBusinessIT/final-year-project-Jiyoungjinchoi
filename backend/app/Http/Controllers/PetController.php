<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PetController extends Controller
{
    // ✅ Get all pets for the logged-in user (Dashboard)
    public function index()
    {
        return response()->json(Auth::user()->pets, 200);
    }

    // ✅ Get a single pet (Edit page)
    public function show(Pet $pet)
    {
        if ($pet->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($pet, 200);
    }

    // ✅ Create a pet profile
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'breed'   => 'nullable|string|max:255',
            'dob'     => 'nullable|date',
            'gender'  => 'nullable|string|max:50',
            'weight'  => 'nullable|numeric|min:0',
            'notes'   => 'nullable|string',

            // Photo validation (type + size)
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $photoPath = null;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('pets', 'public');
        }

        $pet = Pet::create([
            'user_id'    => Auth::id(),
            'name'       => $validated['name'],
            'species'    => $validated['species'],
            'breed'      => $validated['breed'] ?? null,
            'dob'        => $validated['dob'] ?? null,
            'gender'     => $validated['gender'] ?? null,
            'weight'     => $validated['weight'] ?? null,
            'notes'      => $validated['notes'] ?? null,
            'photo_path' => $photoPath,
        ]);

        return response()->json([
            'message' => 'Pet created successfully',
            'pet' => $pet
        ], 201);
    }

    // ✅ Update a pet profile
    public function update(Request $request, Pet $pet)
    {
        if ($pet->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'breed'   => 'nullable|string|max:255',
            'dob'     => 'nullable|date',
            'gender'  => 'nullable|string|max:50',
            'weight'  => 'nullable|numeric|min:0',
            'notes'   => 'nullable|string',

            // Photo replace (optional)
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // If new photo uploaded, delete old one + store new one
        if ($request->hasFile('photo')) {
            if ($pet->photo_path && Storage::disk('public')->exists($pet->photo_path)) {
                Storage::disk('public')->delete($pet->photo_path);
            }
            $pet->photo_path = $request->file('photo')->store('pets', 'public');
        }

        $pet->name = $validated['name'];
        $pet->species = $validated['species'];
        $pet->breed = $validated['breed'] ?? null;
        $pet->dob = $validated['dob'] ?? null;
        $pet->gender = $validated['gender'] ?? null;
        $pet->weight = $validated['weight'] ?? null;
        $pet->notes = $validated['notes'] ?? null;

        $pet->save();

        return response()->json([
            'message' => 'Pet updated successfully',
            'pet' => $pet
        ], 200);
    }
}
