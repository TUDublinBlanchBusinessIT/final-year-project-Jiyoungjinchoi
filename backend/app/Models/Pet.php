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

        // ✅ Sprint 1514: coords for radius/proximity search
        'last_seen_lat',
        'last_seen_lng',

        'lost_photo_path',
        'reported_lost_at',

        // ✅ Sprint 1512: resolved + archived support
        'resolved_at',
        'archived_at',
    ];

    protected $casts = [
        'is_lost' => 'boolean',
        'reported_lost_at' => 'datetime',

        // ✅ Sprint 1512: cast timestamps
        'resolved_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}