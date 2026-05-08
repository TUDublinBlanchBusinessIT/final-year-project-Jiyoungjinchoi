<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Post;
use App\Models\LostPet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
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

        Log::info('Admin approved reported post', [
            'admin_id' => $request->user()->id,
            'post_id' => $post->id,
            'post_owner_id' => $post->user_id,
            'action' => 'approved',
        ]);

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
        }

        Log::info('Admin removed community post', [
            'admin_id' => $request->user()->id,
            'post_id' => $post->id,
            'post_owner_id' => $post->user_id,
            'removed_posts_count' => $removedPostsCount,
            'user_banned' => $owner ? $owner->is_banned : false,
            'action' => 'removed',
        ]);

        return response()->json([
            'message' => 'Post removed successfully.',
            'removed_posts_count' => $removedPostsCount,
            'user_banned' => $owner ? $owner->is_banned : false,
        ]);
    }

    public function users()
    {
        $users = User::select(
                'id',
                'name',
                'email',
                'role',
                'is_banned',
                'account_type',
                'subscription_started_at',
                'created_at'
            )
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                $activityCount = DB::table('admin_logs')
                    ->where('target_type', 'user')
                    ->where('target_id', $user->id)
                    ->count();

                $latestActivity = DB::table('admin_logs')
                    ->leftJoin('users as admins', 'admin_logs.admin_id', '=', 'admins.id')
                    ->where('admin_logs.target_type', 'user')
                    ->where('admin_logs.target_id', $user->id)
                    ->orderByDesc('admin_logs.created_at')
                    ->select(
                        'admin_logs.action',
                        'admin_logs.created_at',
                        'admins.name as admin_name'
                    )
                    ->first();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_banned' => $user->is_banned,
                    'account_type' => $user->account_type,
                    'subscription_started_at' => $user->subscription_started_at,
                    'created_at' => $user->created_at,
                    'activity_count' => $activityCount,
                    'latest_activity' => $latestActivity ? [
                        'action' => $latestActivity->action,
                        'admin_name' => $latestActivity->admin_name,
                        'created_at' => $latestActivity->created_at,
                    ] : null,
                ];
            });

        return response()->json($users);
    }

    public function banUser(Request $request, User $user)
    {
        $user->is_banned = true;
        $user->save();

        $this->logAction($request->user()->id, 'suspended', 'user', $user->id);

        Log::info('Admin suspended user', [
            'admin_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'suspended',
        ]);

        return response()->json([
            'message' => 'User suspended successfully.',
            'user' => $user,
        ]);
    }

    public function unbanUser(Request $request, User $user)
    {
        $user->is_banned = false;
        $user->save();

        $this->logAction($request->user()->id, 'reactivated', 'user', $user->id);

        Log::info('Admin reactivated user', [
            'admin_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'reactivated',
        ]);

        return response()->json([
            'message' => 'User reactivated successfully.',
            'user' => $user,
        ]);
    }

    public function upgradeUser(Request $request, User $user)
    {
        $user->account_type = 'premium';
        $user->subscription_started_at = now();
        $user->save();

        $this->logAction($request->user()->id, 'upgraded', 'user', $user->id);

        Log::info('Admin upgraded user to premium', [
            'admin_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'upgraded',
        ]);

        return response()->json([
            'message' => 'User upgraded to premium successfully.',
            'user' => $user,
        ]);
    }

    public function downgradeUser(Request $request, User $user)
    {
        $user->account_type = 'basic';
        $user->subscription_started_at = null;
        $user->save();

        $this->logAction($request->user()->id, 'downgraded', 'user', $user->id);

        Log::info('Admin downgraded user to basic', [
            'admin_id' => $request->user()->id,
            'target_user_id' => $user->id,
            'action' => 'downgraded',
        ]);

        return response()->json([
            'message' => 'User downgraded to basic successfully.',
            'user' => $user,
        ]);
    }

    private function logAction($adminId, $action, $targetType, $targetId)
    {
        DB::table('admin_logs')->insert([
            'admin_id' => $adminId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}