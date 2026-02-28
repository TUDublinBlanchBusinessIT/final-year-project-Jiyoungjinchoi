<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Pet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',

        // Core fields in your pets table
        'name',
        'species',
        'breed',

        // Lost & Found fields
        'is_lost',
        'lost_status',
        'lost_description',
        'last_seen_location',
        'lost_photo_path',
        'reported_lost_at',
    ];

    protected $casts = [
        'is_lost' => 'boolean',
        'reported_lost_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}