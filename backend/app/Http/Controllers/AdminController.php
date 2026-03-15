<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Post;
use App\Models\LostPet;

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
}