<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function index(Post $post)
    {
        $comments = Comment::with('user:id,name')
            ->where('post_id', $post->id)
            ->latest()
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'content' => $c->content,
                    'created_at' => $c->created_at,
                    'user' => [
                        'id' => $c->user?->id,
                        'name' => $c->user?->name ?? 'User',
                    ],
                ];
            });

        return response()->json($comments, 200);
    }

    public function store(Request $request, Post $post)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment = Comment::create([
            'user_id' => Auth::id(),
            'post_id' => $post->id,
            'content' => $validated['content'],
        ]);

        $comment->load('user:id,name');

        return response()->json([
            'message' => 'Comment added',
            'comment' => [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
                'user' => [
                    'id' => $comment->user?->id,
                    'name' => $comment->user?->name ?? 'User',
                ],
            ],
        ], 201);
    }
}