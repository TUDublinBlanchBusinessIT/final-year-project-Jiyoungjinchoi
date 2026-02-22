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

    // ✅ Get a single pet (Edit / Overview page)
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
            'age'     => 'required|integer|min:0',
            'gender'  => 'nullable|string|max:50',
            'weight'  => 'nullable|numeric|min:0',
            'notes'   => 'nullable|string',
            'photo'   => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
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
            'age'        => $validated['age'],
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
            'age'     => 'required|integer|min:0',
            'gender'  => 'nullable|string|max:50',
            'weight'  => 'nullable|numeric|min:0',
            'notes'   => 'nullable|string',
            'photo'   => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

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
        $pet->age = $validated['age'];
        $pet->gender = $validated['gender'] ?? null;
        $pet->weight = $validated['weight'] ?? null;
        $pet->notes = $validated['notes'] ?? null;

        $pet->save();

        return response()->json([
            'message' => 'Pet updated successfully',
            'pet' => $pet
        ], 200);
    }

    // ✅ Delete a pet profile
    public function destroy(Pet $pet)
    {
        if ($pet->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($pet->photo_path && Storage::disk('public')->exists($pet->photo_path)) {
            Storage::disk('public')->delete($pet->photo_path);
        }

        $pet->delete();

        return response()->json([
            'message' => 'Pet deleted successfully'
        ], 200);
    }
}