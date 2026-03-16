<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Post;
use App\Models\LostPet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'flagged_posts' => Post::count(),
            'reported_users' => User::where('is_banned', 1)->count(),
            'lost_reports' => LostPet::count(),
        ]);
    }

    public function lostReports()
    {
        $reports = LostPet::latest()->get()->map(function ($report) {
            return [
                'id' => $report->id,
                'pet_name' => $report->pet_name,
                'description' => $report->description,
                'location' => $report->location,
                'photo' => $report->photo ? asset('storage/' . $report->photo) : null,
                'status' => $report->status ?? 'pending',
                'moderated_by' => $report->moderated_by,
                'moderated_at' => $report->moderated_at,
                'created_at' => $report->created_at,
            ];
        });

        return response()->json($reports);
    }

    public function approveLostReport(Request $request, LostPet $pet)
    {
        $pet->status = 'approved';
        $pet->moderated_by = $request->user()->id;
        $pet->moderated_at = now();
        $pet->save();

        Log::info('Admin approved lost pet report', [
            'admin_id' => $request->user()->id,
            'lost_pet_id' => $pet->id,
            'action' => 'approved',
        ]);

        return response()->json([
            'message' => 'Lost pet report approved successfully.',
            'pet' => $pet,
        ]);
    }

    public function hideLostReport(Request $request, LostPet $pet)
    {
        $pet->status = 'hidden';
        $pet->moderated_by = $request->user()->id;
        $pet->moderated_at = now();
        $pet->save();

        Log::info('Admin hid lost pet report', [
            'admin_id' => $request->user()->id,
            'lost_pet_id' => $pet->id,
            'action' => 'hidden',
        ]);

        return response()->json([
            'message' => 'Lost pet report hidden successfully.',
            'pet' => $pet,
        ]);
    }

    public function deleteLostReport(Request $request, LostPet $pet)
    {
        Log::info('Admin deleted lost pet report', [
            'admin_id' => $request->user()->id,
            'lost_pet_id' => $pet->id,
            'action' => 'deleted',
        ]);

        $pet->delete();

        return response()->json([
            'message' => 'Lost pet report deleted successfully.',
        ]);
    }
}