<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Post;
use Illuminate\Support\Facades\Auth;

class LikeController extends Controller
{
    public function toggle(Post $post)
    {
        $userId = Auth::id();

        $existing = Like::where('user_id', $userId)
            ->where('post_id', $post->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            Like::create([
                'user_id' => $userId,
                'post_id' => $post->id,
            ]);
            $liked = true;
        }

        $likeCount = Like::where('post_id', $post->id)->count();

        return response()->json([
            'liked' => $liked,
            'like_count' => $likeCount,
        ], 200);
    }
}