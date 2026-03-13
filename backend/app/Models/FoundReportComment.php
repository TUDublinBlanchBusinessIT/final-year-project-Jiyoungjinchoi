<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FoundReportComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'found_report_id',
        'user_id',
        'guest_name',
        'comment',
    ];

    public function foundReport()
    {
        return $this->belongsTo(FoundReport::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}