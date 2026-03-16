<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FoundReportCommentController extends Controller
{
    public function index($foundReport)
    {
        return response()->json([
            'comments' => []
        ]);
    }

    public function store(Request $request, $foundReport)
    {
        return response()->json([
            'message' => 'Comment created successfully'
        ]);
    }
}