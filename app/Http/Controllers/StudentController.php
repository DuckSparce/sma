<?php

namespace App\Http\Controllers;

use App\Http\Requests\StudentRequest;
use Illuminate\Http\Request;
use App\Models\Student;

class StudentController extends Controller
{
    public function getStudentById($id)
    {
        $student = Student::find($id);
        if (!$student) {
            return response()->json(['error' => 'Student not found'], 404);
        }
        return response()->json($student);
    }

    private function checkForDuplicateStudent($data, $excludeId = null)
    {
        $query = Student::where('first_name', $data['first_name'])
            ->where('last_name', $data['last_name'])
            ->where('birthdate', $data['birthdate']);
        
        // If we're updating a student, exclude the current student from the check
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return $query->exists();
    }

    private function validateStudentData($data)
    {
        $errors = [];

        // Validate first_name
        if (!isset($data['first_name']) || !preg_match("/^[A-Z][a-z\-']{1,19}$/", $data['first_name'])) {
            $errors['first_name'][] = "First Name must start with uppercase and contain only letters, apostrophes, or hyphens (2-20 chars).";
        }

        // Validate last_name
        if (!isset($data['last_name']) || !preg_match("/^[A-Z][a-z\-']{1,19}$/", $data['last_name'])) {
            $errors['last_name'][] = "Last Name must start with uppercase and contain only letters, apostrophes, or hyphens (2-20 chars).";
        }

        // Validate group
        $groups = ['PZ-21','PZ-22','PZ-23','PZ-24','PZ-25','PZ-26','PZ-27'];
        if (!isset($data['group']) || !in_array($data['group'], $groups)) {
            $errors['group'][] = "Group must be one of: " . implode(', ', $groups);
        }

        // Validate gender
        if (!isset($data['gender']) || !in_array($data['gender'], ['M', 'F'])) {
            $errors['gender'][] = "Gender must be 'M' or 'F'.";
        }

        // Validate birthdate
        if (!isset($data['birthdate']) || !preg_match("/^\d{4}-\d{2}-\d{2}$/", $data['birthdate'])) {
            $errors['birthdate'][] = "Birthdate must be in YYYY-MM-DD format.";
        } else {
            $date = strtotime($data['birthdate']);
            if ($date === false || $data['birthdate'] < '1945-01-01' || $data['birthdate'] > '2020-01-01') {
                $errors['birthdate'][] = "Birthdate must be between 1945-01-01 and 2020-01-01.";
            }
        }

        // username
        if (!isset($data['username']) || !preg_match("/^[a-zA-Z0-9_.-]{3,20}$/", $data['username'])) {
            $errors['username'][] = "Username must be 3-20 characters and contain only letters, numbers, underscores, dots, or hyphens.";
        } elseif (Student::where('username', $data['username'])->when(isset($data['id']), function($q) use ($data) {
            $q->where('id', '!=', $data['id']);
        })->exists()) {
            $errors['username'][] = "Username already taken.";
        }

        if (
            isset($data['first_name']) && 
            isset($data['last_name']) && 
            isset($data['birthdate']) && 
            !isset($errors['first_name']) && 
            !isset($errors['last_name']) && 
            !isset($errors['birthdate'])
        ) {
            if ($this->checkForDuplicateStudent($data, $data['id'] ?? null)) {
                $errors['duplicate'][] = "A student with this name and birthdate already exists.";
            }
        }

        return $errors;
    }

    public function store(Request $request)
    {
        if (!session('student_id')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $data = $request->all();
        $data['status'] = 'inactive';
        $errors = $this->validateStudentData($data);

        if (!empty($errors)) {
            return response()->json(['errors' => $errors], 422);
        }

        $student = Student::create($data);

        return response()->json([
            'success' => true,
            'student' => $student,
        ]);
    }
    
    public function update(Request $request)
    {
        if (!session('student_id')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $data = $request->all();
        
        // Check if ID is provided
        if (!isset($data['id'])) {
            return response()->json([
                'errors' => ['id' => ['Student ID is required']]
            ], 422);
        }
        
        // Find the student by ID
        $student = Student::find($data['id']);
        if (!$student) {
            return response()->json([
                'errors' => ['id' => ['Student not found']]
            ], 404);
        }
        
        // Validate the data
        $errors = $this->validateStudentData($data);
        
        if (!empty($errors)) {
            return response()->json(['errors' => $errors], 422);
        }
        
        // Update the student with validated data
        $student->update([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'group' => $data['group'],
            'gender' => $data['gender'],
            'birthdate' => $data['birthdate']
        ]);
        
        return response()->json([
            'success' => true,
            'student' => $student,
        ]);
    }

    public function getAllStudents(Request $request) {
        $perPage = $request->query('per_page', 4); // Default 4 per page
        $students = Student::orderBy('id')->paginate($perPage);

        // Return pagination info and students
        return response()->json([
            'students' => $students->items(),
            'current_page' => $students->currentPage(),
            'total_pages' => $students->lastPage(),
            'total' => $students->total(),
        ]);
    }

    public function deleteStudent(Request $request) {
        if (!session('student_id')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        $data = $request->all();
        $deleted = Student::where("id", $data['id'])->delete();
    
        // Log out if the deleted student is the current user
        if (session('student_id') == $data['id']) {
            $request->session()->forget('student_id');
        }
    
        return response()->json([
            'success' => $deleted > 0,
            'deleted_id' => $data['id']
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->only('username', 'password');
        $student = Student::where('username', $credentials['username'])->first();

        if (!$student) {
            return back()->withErrors(['username' => 'Invalid username or password.']);
        }

        $expectedPassword = date('dmY', strtotime($student->birthdate));
        if ($credentials['password'] !== $expectedPassword) {
            return back()->withErrors(['username' => 'Invalid username or password.']);
        }

        // Mark as active
        $student->status = 'active';
        $student->save();

        session(['student_id' => $student->id]);
        return redirect('/students');
    }

    public function logout(Request $request)
    {
        if (session('student_id')) {
            $student = Student::find(session('student_id'));
            if ($student) {
                $student->status = 'inactive';
                $student->save();
            }
        }

        $request->session()->forget('student_id');
        return redirect('/students');
    }

    public function register(Request $request)
    {
        $data = $request->all();
        $data['status'] = 'active';
        $errors = $this->validateStudentData($data);

        if (!empty($errors)) {
            return back()->withErrors($errors)->withInput();
        }

        $student = Student::create($data);

        // Log in the student (store id in session)
        session(['student_id' => $student->id]);

        return redirect('/students');
    }
}
