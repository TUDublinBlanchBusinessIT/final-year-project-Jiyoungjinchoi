<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LostPet;
use App\Models\FoundReport;
use App\Models\Sighting;
use Illuminate\Http\Request;

class PremiumLostFoundController extends Controller
{
    public function index(Request $request)
    {
        $lostPets = LostPet::query()
            ->where('is_lost', true)
            ->latest()
            ->get()
            ->map(function ($pet) {
                return [
                    'id' => $pet->id,
                    'type' => 'lost',
                    'priority' => false,
                    'name' => $pet->name ?? 'Unknown Pet',
                    'species' => $pet->species ?? 'Unknown',
                    'breed' => $pet->breed ?? 'Unknown',
                    'area' => $pet->last_seen_location ?? 'Unknown area',
                    'description' => $pet->lost_description ?? '',
                    'lat' => (float) ($pet->latitude ?? 53.3498),
                    'lng' => (float) ($pet->longitude ?? -6.2603),
                    'lostDate' => optional($pet->reported_lost_at)?->format('Y-m-d'),
                    'image' => $this->makeImageUrl($pet->lost_photo_path),
                    'status' => $pet->lost_status === 'resolved'
                        ? 'Resolved'
                        : 'Missing Pet',
                ];
            });

        $foundReports = FoundReport::query()
            ->latest()
            ->get()
            ->map(function ($report) {
                return [
                    'id' => $report->id,
                    'type' => 'found',
                    'priority' => false,
                    'name' => $report->name ?? 'Found Pet',
                    'species' => $report->species ?? 'Unknown',
                    'breed' => $report->breed ?? 'Unknown',
                    'area' => $report->found_location ?? $report->location ?? 'Unknown area',
                    'description' => $report->description ?? '',
                    'lat' => (float) ($report->found_lat ?? $report->latitude ?? 53.3498),
                    'lng' => (float) ($report->found_lng ?? $report->longitude ?? -6.2603),
                    'lostDate' => optional($report->created_at)?->format('Y-m-d'),
                    'image' => $this->makeImageUrl(
                        $report->image_path
                            ?? $report->photo
                            ?? $report->image
                            ?? null
                    ),
                    'status' => 'Found Report',
                ];
            });

        $sightings = Sighting::query()
            ->latest()
            ->get()
            ->map(function ($sighting) {
                return [
                    'id' => $sighting->id,
                    'type' => 'sighting',
                    'priority' => false,
                    'name' => $sighting->title ?? $sighting->name ?? 'Pet Sighting',
                    'species' => $sighting->species ?? 'Unknown',
                    'breed' => $sighting->breed ?? 'Unknown',
                    'area' => $sighting->location ?? $sighting->sighting_location ?? 'Unknown area',
                    'description' => $sighting->description ?? '',
                    'lat' => (float) ($sighting->lat ?? $sighting->latitude ?? 53.3498),
                    'lng' => (float) ($sighting->lng ?? $sighting->longitude ?? -6.2603),
                    'lostDate' => optional($sighting->created_at)?->format('Y-m-d'),
                    'image' => $this->makeImageUrl(
                        $sighting->image_path
                            ?? $sighting->photo
                            ?? $sighting->image
                            ?? null
                    ),
                    'status' => 'Sighting',
                ];
            });

        $reports = $lostPets
            ->concat($foundReports)
            ->concat($sightings)
            ->values();

        return response()->json([
            'reports' => $reports,
        ]);
    }

    private function makeImageUrl($path)
    {
        if (!$path) {
            return 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80';
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if (str_starts_with($path, '/storage/')) {
            return asset(ltrim($path, '/'));
        }

        return asset('storage/' . ltrim($path, '/'));
    }
}