<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PostController extends Controller
{
    // ✅ List posts newest first
    public function index()
    {
        $posts = Post::with('user:id,name')
            ->latest()
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'content' => $p->content,
                    'image_url' => $p->image_path ? url('storage/' . $p->image_path) : null,
                    'created_at' => $p->created_at,
                    'user' => [
                        'id' => $p->user?->id,
                        'name' => $p->user?->name ?? 'User',
                    ],
                ];
            });

        return response()->json($posts, 200);
    }

    // ✅ Create post (text + optional image)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:2000',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('posts', 'public');
        }

        $post = Post::create([
            'user_id' => Auth::id(),
            'content' => $validated['content'],
            'image_path' => $imagePath,
        ]);

        return response()->json([
            'message' => 'Post created successfully',
            'post' => $post,
        ], 201);
    }
}