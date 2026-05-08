<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Pet;

class Sighting extends Model
{
    use HasFactory;

    protected $fillable = [
        'pet_id',
        'reported_by',
        'location',
        'lat',
        'lng',
        'notes',
        'photo_path',
        'owner_notified_at',
    ];

    protected $casts = [
        'owner_notified_at' => 'datetime',
        'lat' => 'float',
        'lng' => 'float',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class, 'pet_id');
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}