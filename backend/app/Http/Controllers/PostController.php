<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    // Get all posts (feed)
    public function index()
    {
        $userId = Auth::id();

        $posts = Post::with(['user:id,name', 'pet:id,name,breed,species'])
            ->withCount(['likes', 'comments'])
            ->where('status', 'active')
            ->latest()
            ->get()
            ->map(function ($post) use ($userId) {
                $post->image_url = $post->image_path
                    ? url('storage/' . $post->image_path)
                    : null;

                $post->liked_by_me = $userId
                    ? $post->likes()->where('user_id', $userId)->exists()
                    : false;

                $post->like_count = (int) ($post->likes_count ?? 0);
                $post->comment_count = (int) ($post->comments_count ?? 0);

                $post->likes_count = (int) ($post->likes_count ?? 0);
                $post->comments_count = (int) ($post->comments_count ?? 0);

                return $post;
            });

        return response()->json($posts, 200);
    }

    // Create a post
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
            'image'   => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'pet_id'  => ['nullable', 'exists:pets,id'],
        ]);

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('posts', 'public');
        }

        $post = Post::create([
            'user_id'    => Auth::id(),
            'pet_id'     => $validated['pet_id'] ?? null,
            'content'    => $validated['content'],
            'image_path' => $imagePath,
        ]);

        $post->load(['user:id,name', 'pet:id,name,breed,species']);

        $post->image_url = $post->image_path ? url('storage/' . $post->image_path) : null;
        $post->like_count = 0;
        $post->comment_count = 0;
        $post->liked_by_me = false;

        $post->likes_count = 0;
        $post->comments_count = 0;

        return response()->json($post, 201);
    }

    // Report a post
    public function report(Post $post)
    {
        $post->report_count = ($post->report_count ?? 0) + 1;
        $post->is_reported = true;
        $post->save();

        \Log::info('Post reported', [
            'post_id' => $post->id,
            'reported_by' => Auth::id(),
            'report_count' => $post->report_count,
        ]);

        return response()->json([
            'message' => 'Post reported successfully.',
            'report_count' => $post->report_count,
        ], 200);
    }

    // Delete a post
    public function destroy(Post $post)
    {
        if ($post->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($post->image_path) {
            Storage::disk('public')->delete($post->image_path);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted'], 200);
    }
}