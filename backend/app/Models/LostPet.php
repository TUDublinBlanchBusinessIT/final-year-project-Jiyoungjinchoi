<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LostPet extends Model
{
    use HasFactory;

    protected $table = 'pets';

    protected $fillable = [
        'user_id',
        'name',
        'species',
        'breed',
        'photo_path',

        'is_lost',
        'lost_status',
        'lost_description',
        'last_seen_location',
        'lost_photo_path',
        'reported_lost_at',

        'resolved_at',
        'archived_at',
        'is_priority',
        'last_seen_lat',
        'last_seen_lng',
    ];

    protected $casts = [
        'is_lost' => 'boolean',
        'is_priority' => 'boolean',
        'reported_lost_at' => 'datetime',
        'resolved_at' => 'datetime',
        'archived_at' => 'datetime',
    ];
}