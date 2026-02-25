<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    // ✅ List comments for a post
    public function index(Post $post)
    {
        $comments = Comment::with('user:id,name')
            ->where('post_id', $post->id)
            ->latest()
            ->get();

        return response()->json($comments, 200);
    }

    // ✅ Create comment for a post
    public function store(Request $request, Post $post)
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'max:1000'],
        ]);

        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => Auth::id(),
            'content' => $validated['content'],
        ]);

        $comment->load('user:id,name');

        return response()->json([
            'message' => 'Comment created',
            'comment' => $comment,
        ], 201);
    }

    /**
     * ✅ DELETE comment by ID
     * Route: DELETE /api/comments/{comment}
     */
    public function destroy(Comment $comment)
    {
        // ✅ Only comment owner can delete
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted'], 200);
    }

    /**
     * ✅ DELETE comment inside a post (extra validation)
     * Route: DELETE /api/posts/{post}/comments/{comment}
     */
    public function destroyForPost(Post $post, Comment $comment)
    {
        // ✅ Ensure comment belongs to this post (prevents deleting wrong comment)
        if ((int)$comment->post_id !== (int)$post->id) {
            return response()->json(['message' => 'Comment does not belong to this post'], 404);
        }

        // ✅ Only comment owner can delete
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted'], 200);
    }
}