<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'group',
        'first_name',
        'last_name',
        'gender',
        'birthdate',
        'status',
        'username'
    ];
}
