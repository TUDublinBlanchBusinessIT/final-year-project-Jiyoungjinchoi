<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\Request;

class LostPetController extends Controller
{
    /**
     * GET /api/lost-pets
     * Sprint 1514: Search & filter (species, breed, location, radius) + sort (date/proximity)
     *
     * Query params (all optional):
     *  - species=Dog
     *  - breed=retriever   (partial match)
     *  - location=tallaght (partial match)
     *  - lat=53.123
     *  - lng=-6.234
     *  - radius_km=5
     *  - sort=date | proximity
     */
    public function index(Request $request)
    {
        $q = Pet::query()
            ->where('is_lost', true)
            ->whereNull('archived_at')
            ->where(function ($q2) {
                $q2->whereNull('lost_status')
                   ->orWhere('lost_status', '!=', 'Resolved');
            });

        // ✅ Filter: species (exact)
        if ($request->filled('species')) {
            $q->where('species', $request->string('species')->toString());
        }

        // ✅ Filter: breed (partial)
        if ($request->filled('breed')) {
            $breed = $request->string('breed')->toString();
            $q->where('breed', 'like', "%{$breed}%");
        }

        // ✅ Filter: location (partial)
        if ($request->filled('location')) {
            $loc = $request->string('location')->toString();
            $q->where('last_seen_location', 'like', "%{$loc}%");
        }

        // ✅ Radius & proximity sorting needs coords
        $lat = $request->input('lat');
        $lng = $request->input('lng');
        $radiusKm = $request->input('radius_km'); // e.g. 1, 5, 10
        $sort = $request->input('sort', 'date');  // date | proximity

        $hasCoords = is_numeric($lat) && is_numeric($lng);

        if ($hasCoords) {
            $lat = (float) $lat;
            $lng = (float) $lng;

            // Compute distance_km (MySQL)
            $q->select('*')->selectRaw(
                "(6371 * acos(
                    cos(radians(?)) * cos(radians(last_seen_lat))
                    * cos(radians(last_seen_lng) - radians(?))
                    + sin(radians(?)) * sin(radians(last_seen_lat))
                )) as distance_km",
                [$lat, $lng, $lat]
            )
            ->whereNotNull('last_seen_lat')
            ->whereNotNull('last_seen_lng');

            // ✅ Filter by radius
            if (is_numeric($radiusKm)) {
                $radiusKm = (float) $radiusKm;
                $q->having('distance_km', '<=', $radiusKm);
            }

            // ✅ Sort by proximity or by date
            if ($sort === 'proximity') {
                $q->orderBy('distance_km', 'asc');
            } else {
                $q->orderByDesc('reported_lost_at');
            }
        } else {
            // default sort
            $q->orderByDesc('reported_lost_at');
        }

        $lostPets = $q->get()->map(fn ($pet) => $this->formatLostPet($pet));

        return response()->json($lostPets, 200);
    }

    /**
     * POST /api/lost-pets
     * Create a new lost pet report (stores image + sets is_lost=true)
     *
     * Sprint 1514 additions:
     * - species (optional)
     * - breed (optional)
     * - last_seen_lat / last_seen_lng (optional coords for radius/proximity search)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_name' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'last_seen_location' => ['required', 'string', 'max:255'],
            'photo' => ['required', 'image', 'max:4096'],

            // ✅ NEW (1514)
            'species' => ['nullable', 'string', 'max:255'],
            'breed' => ['nullable', 'string', 'max:255'],
            'last_seen_lat' => ['nullable', 'numeric'],
            'last_seen_lng' => ['nullable', 'numeric'],
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

            // ✅ NEW (1514): allow saving species/breed if provided
            'species' => $validated['species'] ?? 'Unknown',
            'breed' => $validated['breed'] ?? null,

            'is_lost' => true,
            'lost_status' => 'Active',
            'lost_description' => $validated['description'],
            'last_seen_location' => $validated['last_seen_location'],

            // ✅ NEW (1514): coords optional
            'last_seen_lat' => $validated['last_seen_lat'] ?? null,
            'last_seen_lng' => $validated['last_seen_lng'] ?? null,

            'lost_photo_path' => $path,
            'reported_lost_at' => now(),

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
        if (!$pet->is_lost) {
            return response()->json(['message' => 'This pet is not marked as lost.'], 400);
        }

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

            // ✅ NEW: include these so frontend can filter and show distance
            'species' => $pet->species,
            'breed' => $pet->breed,
            'last_seen_lat' => $pet->last_seen_lat,
            'last_seen_lng' => $pet->last_seen_lng,

            // if distance_km was computed in query
            'distance_km' => isset($pet->distance_km) ? round((float) $pet->distance_km, 2) : null,

            'resolved_at' => $pet->resolved_at,
            'archived_at' => $pet->archived_at,

            'photo_url' => $pet->lost_photo_path
                ? asset('storage/' . $pet->lost_photo_path)
                : null,
        ];
    }
}