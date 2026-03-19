<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Post;
use App\Models\LostPet;
use App\Models\AdminLog; // ✅ NEW
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    // ✅ Logging helper
    private function logAction($adminId, $action, $type, $targetId)
    {
        AdminLog::create([
            'admin_id' => $adminId,
            'action' => $action,
            'target_type' => $type,
            'target_id' => $targetId,
        ]);
    }

    public function dashboard()
    {
        return response()->json([
            'flagged_posts' => Post::where('is_reported', true)->count(),
            'reported_users' => User::where('is_banned', 1)->count(),
            'lost_reports' => LostPet::where('is_lost', true)->count(),
        ]);
    }

    public function lostReports()
    {
        $reports = LostPet::where('is_lost', true)
            ->latest()
            ->get()
            ->map(function ($report) {
                $photoUrl = null;

                if ($report->lost_photo_path) {
                    $photoUrl = asset('storage/' . $report->lost_photo_path);
                } elseif ($report->photo_path) {
                    $photoUrl = asset('storage/' . $report->photo_path);
                }

                return [
                    'id' => $report->id,
                    'pet_name' => $report->name ?? 'Unnamed Pet',
                    'description' => $report->lost_description ?? 'No description provided.',
                    'location' => $report->last_seen_location ?? 'No location',
                    'photo' => $photoUrl,
                    'status' => $report->status ?? ($report->lost_status ?? 'active'),
                    'moderated_by' => $report->moderated_by,
                    'moderated_at' => $report->moderated_at,
                    'created_at' => $report->reported_lost_at ?? $report->created_at,
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

        // ✅ LOG
        $this->logAction($request->user()->id, 'approved', 'lost_pet', $pet->id);

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

        // ✅ LOG
        $this->logAction($request->user()->id, 'hidden', 'lost_pet', $pet->id);

        return response()->json([
            'message' => 'Lost pet report hidden successfully.',
            'pet' => $pet,
        ]);
    }

    public function deleteLostReport(Request $request, LostPet $pet)
    {
        // ✅ LOG BEFORE DELETE
        $this->logAction($request->user()->id, 'deleted', 'lost_pet', $pet->id);

        $pet->delete();

        return response()->json([
            'message' => 'Lost pet report deleted successfully.',
        ]);
    }

    public function reportedPosts()
    {
        $posts = Post::with('user:id,name')
            ->where('is_reported', true)
            ->latest()
            ->get()
            ->map(function ($post) {
                return [
                    'id' => $post->id,
                    'content' => $post->content,
                    'image_url' => $post->image_path ? asset('storage/' . $post->image_path) : null,
                    'status' => $post->status,
                    'is_reported' => $post->is_reported,
                    'report_count' => $post->report_count,
                    'created_at' => $post->created_at,
                    'user' => $post->user ? [
                        'id' => $post->user->id,
                        'name' => $post->user->name,
                    ] : null,
                ];
            });

        return response()->json($posts);
    }

    public function approvePost(Request $request, Post $post)
    {
        $post->is_reported = false;
        $post->report_count = 0;
        $post->save();

        // ✅ LOG
        $this->logAction($request->user()->id, 'approved', 'post', $post->id);

        return response()->json([
            'message' => 'Post approved successfully.',
            'post' => $post,
        ]);
    }

    public function removePost(Request $request, Post $post)
    {
        $post->status = 'removed';
        $post->save();

        $removedPostsCount = Post::where('user_id', $post->user_id)
            ->where('status', 'removed')
            ->count();

        $owner = User::find($post->user_id);

        if ($owner && $removedPostsCount >= 3) {
            $owner->is_banned = true;
            $owner->save();

            // ✅ LOG AUTO BAN
            $this->logAction($request->user()->id, 'banned', 'user', $owner->id);
        }

        // ✅ LOG
        $this->logAction($request->user()->id, 'removed', 'post', $post->id);

        return response()->json([
            'message' => 'Post removed successfully.',
            'removed_posts_count' => $removedPostsCount,
            'user_banned' => $owner ? $owner->is_banned : false,
        ]);
    }

    public function users()
    {
        $users = User::select('id', 'name', 'email', 'is_banned', 'is_suspended', 'created_at')
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    public function suspendUser(Request $request, User $user)
    {
        $user->is_suspended = true;
        $user->save();

        // ✅ LOG
        $this->logAction($request->user()->id, 'suspended', 'user', $user->id);

        return response()->json([
            'message' => 'User suspended successfully.',
            'user' => $user,
        ]);
    }

    public function unsuspendUser(Request $request, User $user)
    {
        $user->is_suspended = false;
        $user->save();

        // ✅ LOG
        $this->logAction($request->user()->id, 'unsuspended', 'user', $user->id);

        return response()->json([
            'message' => 'User unsuspended successfully.',
            'user' => $user,
        ]);
    }

    public function banUser(Request $request, User $user)
    {
        $user->is_banned = true;
        $user->save();

        // ✅ LOG
        $this->logAction($request->user()->id, 'banned', 'user', $user->id);

        return response()->json([
            'message' => 'User banned successfully.',
            'user' => $user,
        ]);
    }

    public function unbanUser(Request $request, User $user)
    {
        $user->is_banned = false;
        $user->save();

        // ✅ LOG
        $this->logAction($request->user()->id, 'unbanned', 'user', $user->id);

        return response()->json([
            'message' => 'User unbanned successfully.',
            'user' => $user,
        ]);
    }

    // ✅ GET LOGS
    public function logs()
    {
        return AdminLog::with('admin:id,name')
            ->latest()
            ->take(50)
            ->get();
    }
}