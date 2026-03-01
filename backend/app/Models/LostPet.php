<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LostPet extends Model
{
    use HasFactory;

    // Your lost pets are stored in the "pets" table
    protected $table = 'pets';

    protected $fillable = [
        'user_id',
        'name',
        'species',
        'breed',

        'is_lost',
        'lost_status',
        'lost_description',
        'last_seen_location',
        'lost_photo_path',
        'reported_lost_at',

        'resolved_at',
        'archived_at',
    ];

    protected $casts = [
        'is_lost' => 'boolean',
        'reported_lost_at' => 'datetime',
        'resolved_at' => 'datetime',
        'archived_at' => 'datetime',
    ];
}