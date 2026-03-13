<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FoundReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reporter_name',
        'species',
        'breed',
        'colour',
        'description',
        'location_found',
        'found_at',
        'photo_path',
        'notes',
    ];

    protected $casts = [
        'found_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(FoundReportComment::class)->latest();
    }
}