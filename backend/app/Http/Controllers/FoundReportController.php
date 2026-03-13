<?php

namespace App\Http\Controllers;

use App\Models\FoundReport;
use Illuminate\Http\Request;

class FoundReportController extends Controller
{
    /**
     * GET /api/found-reports
     * Public list
     */
    public function index()
    {
        $reports = FoundReport::with(['user:id,name', 'comments.user:id,name'])
            ->latest()
            ->get()
            ->map(fn ($report) => $this->formatReport($report));

        return response()->json($reports, 200);
    }

    /**
     * GET /api/found-reports/{foundReport}
     * Public single report
     */
    public function show(FoundReport $foundReport)
    {
        $foundReport->load(['user:id,name', 'comments.user:id,name']);

        return response()->json($this->formatReport($foundReport), 200);
    }

    /**
     * POST /api/found-reports
     * Authenticated creation
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'species' => ['nullable', 'string', 'max:255'],
            'breed' => ['nullable', 'string', 'max:255'],
            'colour' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'location_found' => ['required', 'string', 'max:255'],
            'found_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'max:4096'],
        ]);

        $user = $request->user();

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('foundreports', 'public');
        }

        $report = FoundReport::create([
            'user_id' => $user?->id,
            'reporter_name' => $user?->name,
            'species' => $validated['species'] ?? null,
            'breed' => $validated['breed'] ?? null,
            'colour' => $validated['colour'] ?? null,
            'description' => $validated['description'],
            'location_found' => $validated['location_found'],
            'found_at' => $validated['found_at'] ?? now(),
            'photo_path' => $photoPath,
            'notes' => $validated['notes'] ?? null,
        ]);

        $report->load(['user:id,name', 'comments.user:id,name']);

        return response()->json([
            'message' => 'Found report submitted successfully.',
            'data' => $this->formatReport($report),
        ], 201);
    }

    private function formatReport(FoundReport $report): array
    {
        return [
            'id' => $report->id,
            'species' => $report->species,
            'breed' => $report->breed,
            'colour' => $report->colour,
            'description' => $report->description,
            'location_found' => $report->location_found,
            'found_at' => $report->found_at,
            'notes' => $report->notes,
            'reporter_name' => $report->reporter_name ?: optional($report->user)->name ?: 'Community Member',
            'photo_url' => $report->photo_path ? asset('storage/' . $report->photo_path) : null,
            'comments' => $report->comments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'comment' => $comment->comment,
                    'commenter_name' => optional($comment->user)->name ?: $comment->guest_name ?: 'Community Member',
                    'created_at' => $comment->created_at,
                ];
            })->values(),
        ];
    }
}