<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'breed',
        'age',
        'photo',
        'notes',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
