<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\Request;

class LostPetController extends Controller
{
    /**
     * GET /api/lost-pets
     * List all pets marked as lost AND not archived/resolved
     */
    public function index()
    {
        $lostPets = Pet::query()
            ->where('is_lost', true)
            ->where(function ($q) {
                // Show only active items (not resolved + not archived)
                $q->whereNull('archived_at')
                  ->where(function ($q2) {
                      $q2->whereNull('lost_status')
                         ->orWhere('lost_status', '!=', 'Resolved');
                  });
            })
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

        // ✅ Create in pets table (your project uses Pet model for lost reports)
        $pet = Pet::create([
            'user_id' => $user->id,

            // DB column is "name"
            'name' => $validated['pet_name'] ?? 'Unknown',

            // Required fields in your pets table
            'species' => 'Unknown',
            'breed' => null,

            'is_lost' => true,
            'lost_status' => 'Active',
            'lost_description' => $validated['description'],
            'last_seen_location' => $validated['last_seen_location'],
            'lost_photo_path' => $path,
            'reported_lost_at' => now(),

            // NEW (safe even if nullable columns exist)
            'resolved_at' => null,
            'archived_at' => null,
        ]);

        return response()->json($this->formatLostPet($pet), 201);
    }

    /**
     * PATCH /api/lost-pets/{pet}/resolve
     * Sprint 1512: Mark a lost report as Resolved + archive it
     */
    public function resolve(Request $request, Pet $pet)
    {
        // Basic guard: only lost reports can be resolved
        if (!$pet->is_lost) {
            return response()->json(['message' => 'This pet is not marked as lost.'], 400);
        }

        // OPTIONAL: if you want only the owner to resolve, uncomment:
        // if ($request->user()->id !== $pet->user_id) {
        //     return response()->json(['message' => 'Forbidden.'], 403);
        // }

        // Already resolved?
        if ($pet->lost_status === 'Resolved' || $pet->archived_at) {
            return response()->json([
                'message' => 'This report is already resolved.',
                'data' => $this->formatLostPet($pet),
            ], 200);
        }

        $pet->lost_status = 'Resolved';
        $pet->resolved_at = now();
        $pet->archived_at = now();
        $pet->save();

        return response()->json([
            'message' => 'Lost pet report marked as Resolved.',
            'data' => $this->formatLostPet($pet),
        ], 200);
    }

    private function formatLostPet(Pet $pet): array
    {
        return [
            'id' => $pet->id,

            // return pet_name to frontend
            'pet_name' => $pet->name,

            'status' => $pet->lost_status,
            'description' => $pet->lost_description,
            'last_seen_location' => $pet->last_seen_location,
            'reported_lost_at' => $pet->reported_lost_at,

            // NEW
            'resolved_at' => $pet->resolved_at,
            'archived_at' => $pet->archived_at,

            'photo_url' => $pet->lost_photo_path
                ? asset('storage/' . $pet->lost_photo_path)
                : null,
        ];
    }
}