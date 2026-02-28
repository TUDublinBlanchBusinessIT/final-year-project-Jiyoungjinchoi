<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LostPet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pet_name',
        'pet_type',
        'description',
        'location',
        'photo_path',
        'status',
    ];
}