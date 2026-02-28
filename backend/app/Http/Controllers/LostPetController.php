<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\Request;

class LostPetController extends Controller
{
    /**
     * GET /api/lost-pets
     * List all pets marked as lost (Active)
     */
    public function index()
    {
        $lostPets = Pet::query()
            ->where('is_lost', true)
            ->orderByDesc('reported_lost_at')
            ->get()
            ->map(fn ($pet) => $this->formatLostPet($pet));

        return response()->json($lostPets, 200);
    }

    /**
     * POST /api/lost-pets
     * Create a new lost pet report (stores image + sets is_lost=true)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_name' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'last_seen_location' => ['required', 'string', 'max:255'],
            'photo' => ['required', 'image', 'max:4096'],
        ]);

        // ✅ Must be logged in (auth:sanctum route group)
        $user = $request->user();

        // ✅ Store image in storage/app/public/lostpets
        $path = $request->file('photo')->store('lostpets', 'public');

        // ✅ IMPORTANT: Your pets table requires user_id + species (and maybe others)
        $pet = Pet::create([
            'user_id' => $user->id,

            // Using "name" because your DB column is "name"
            'name' => $validated['pet_name'] ?? 'Unknown',

            // ✅ Required column fix
            'species' => 'Unknown',

            // If your DB requires breed (NOT NULL), change this to 'Unknown' too
            // If breed is nullable, null is fine.
            'breed' => null,

            'is_lost' => true,
            'lost_status' => 'Active',
            'lost_description' => $validated['description'],
            'last_seen_location' => $validated['last_seen_location'],
            'lost_photo_path' => $path,
            'reported_lost_at' => now(),
        ]);

        return response()->json($this->formatLostPet($pet), 201);
    }

    private function formatLostPet(Pet $pet): array
    {
        return [
            'id' => $pet->id,

            // We store in "name", but return pet_name to frontend
            'pet_name' => $pet->name,

            'status' => $pet->lost_status,
            'description' => $pet->lost_description,
            'last_seen_location' => $pet->last_seen_location,
            'reported_lost_at' => $pet->reported_lost_at,

            'photo_url' => $pet->lost_photo_path
                ? asset('storage/' . $pet->lost_photo_path)
                : null,
        ];
    }
}