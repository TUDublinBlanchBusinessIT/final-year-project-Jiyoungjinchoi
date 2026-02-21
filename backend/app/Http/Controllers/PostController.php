<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    // ✅ Get all posts (feed)
    public function index()
    {
        $userId = Auth::id();

        $posts = Post::with('user:id,name')
            ->withCount(['likes', 'comments'])
            ->latest()
            ->get()
            ->map(function ($post) use ($userId) {
                // add image_url for frontend
                $post->image_url = $post->image_path
                    ? url('storage/' . $post->image_path)
                    : null;

                // liked_by_me flag
                $post->liked_by_me = $userId
                    ? $post->likes()->where('user_id', $userId)->exists()
                    : false;

                // rename counts to match frontend usage (optional but nice)
                $post->likes_count = $post->likes_count ?? 0;
                $post->comments_count = $post->comments_count ?? 0;

                return $post;
            });

        return response()->json($posts, 200);
    }

    // ✅ Create a post
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
            'image'   => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $imagePath = null;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('posts', 'public');
        }

        $post = Post::create([
            'user_id'    => Auth::id(),
            'content'    => $validated['content'],
            'image_path' => $imagePath,
        ]);

        $post->load('user:id,name');

        // return consistent shape
        $post->image_url = $post->image_path ? url('storage/' . $post->image_path) : null;
        $post->likes_count = 0;
        $post->comments_count = 0;
        $post->liked_by_me = false;

        return response()->json($post, 201);
    }
}