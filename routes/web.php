<?php

use App\Http\Controllers\StudentController;
use Illuminate\Support\Facades\Route;
use App\Models\Student;
use Illuminate\Support\Facades\DB;

Route::get('/', function () {
    return redirect('students');
});

Route::get('/students', function () {
    return view('students');
});

Route::get('/dashboard', function () {
    return view('dashboard');
});

Route::get('/tasks', function () {
    return view('tasks');
});

Route::get('/messages', function () {
    return view('messages');
});

Route::get('/table/students',  [StudentController::class, 'getAllStudents']);

Route::get('/api/student/{id}', [StudentController::class, 'getStudentById']);

Route::post('/add-student', [StudentController::class, 'store']);

Route::patch('/edit-student', [StudentController::class, 'update']);

Route::delete('/delete-student', [StudentController::class,'deleteStudent']);

Route::get('/login', function (\Illuminate\Http\Request $request) {
    $request->session()->forget('student_id');
    return view('login');
});

Route::post('/login', [StudentController::class, 'login']);

Route::post('/logout', [StudentController::class, 'logout']);

Route::get('/register', function () {
    return view('register');
});
Route::post('/register', [StudentController::class, 'register']);

Route::get('/api/students', function () {
    return response()->json(Student::all());
});
