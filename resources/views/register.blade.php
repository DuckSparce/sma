<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Registration</title>
  <link rel="stylesheet" href="/css/page.css">
  <link rel="stylesheet" href="/css/students/form.css">
</head>
<body style="background-color: var(--primary-color); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div class="student-form-container open" style="position: static; transform: none; right: 0; top: 0;">
    <div class="form-header">
      <h3 aria-label="Registration form title">Student Registration</h3>
    </div>
    <form method="POST" action="/register" aria-label="Student registration form">
      @csrf
      @if($errors->any())
        <div class="validation-error" style="color: #e63946; margin-bottom: 10px;">{{ $errors->first() }}</div>
      @endif
      <div class="form-group">
        <label for="group">Group</label>
        <select name="group" id="group" required>
          <option value="">Select group</option>
          <option value="PZ-21">PZ-21</option>
          <option value="PZ-22">PZ-22</option>
          <option value="PZ-23">PZ-23</option>
          <option value="PZ-24">PZ-24</option>
          <option value="PZ-25">PZ-25</option>
          <option value="PZ-26">PZ-26</option>
          <option value="PZ-27">PZ-27</option>
        </select>
      </div>
      <div class="form-group">
        <label for="first_name">First Name</label>
        <input type="text" name="first_name" id="first_name" required>
      </div>
      <div class="form-group">
        <label for="last_name">Last Name</label>
        <input type="text" name="last_name" id="last_name" required>
      </div>
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" name="username" id="username" required>
      </div>
      <div class="form-group">
        <label for="gender">Gender</label>
        <select name="gender" id="gender" required>
          <option value="">Select gender</option>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
      </div>
      <div class="form-group">
        <label for="birthdate">Birthdate</label>
        <input type="date" name="birthdate" id="birthdate" required>
      </div>
      <div class="form-buttons">
        <button type="submit" class="submit-btn" aria-label="Register">Register</button>
      </div>
      <div style="margin-top: 10px; text-align: center;">
        <a href="/login" style="color: #00b4d8; text-decoration: underline;">Already have an account? Log in</a>
      </div>
    </form>
  </div>
</body>
</html>