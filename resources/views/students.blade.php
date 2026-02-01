<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="author" content="Artem Kachur" />
  <meta name="description" content="A basic student management system" />
  <meta name="keywords" content="students, sma, management" />
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Students</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/page.css') }}">
  <link rel="stylesheet" href="{{ asset('css/header.css') }}">
  <link rel="stylesheet" href="{{ asset('css/students/header.css') }}">
  <link rel="stylesheet" href="{{ asset('css/students/table.css') }}">
  <link rel="stylesheet" href="{{ asset('css/navigation.css') }}">
  <link rel="stylesheet" href="{{ asset('css/students/form.css') }}">
  
  {{-- <link rel="manifest" href="/manifest.json" /> --}}
  {{-- <script src="../js/service-worker-link.js"></script> --}}
</head>

<body data-page="students">
  <script>
    window.isLoggedIn = {{ session('student_id') ? 'true' : 'false' }};
    window.loggedStudentId = @json(session('student_id'));
  </script>

  @include('partials.header')

  <section class="content-page" aria-label="Main content">
    
    @include('partials.navigation')

    <div class="content-container" aria-label="Students content">
      <div class="students-top-container">
        <h2 class="page-title" aria-label="Students page title">Students</h2>
        @if(session('student_id'))
          <button type="button" class="add-button" id="addStudentBtn" aria-label="Add new student">+</button>
        @endif
      </div>
      <div class="students-table-wrapper" aria-label="Students table wrapper">
        <table class="students-table" aria-label="Students table">
          <tr>
            <th><input type="checkbox" aria-label="Select all students" id="selectAllStudents"> All</th>
            <th aria-label="Student group column">Group</th>
            <th aria-label="Student name column">Name</th>
            <th aria-label="Student gender column">Gender</th>
            <th aria-label="Student birthday column">Birthday</th>
            <th aria-label="Student status column">Status</th>
            <th aria-label="Student options column">Options</th>
          </tr>
        </table>
      </div>
      <div class="table-navigation" aria-label="Table navigation">
        <button type="button" class="table-navigation-button" id="prevPageBtn" aria-label="Previous page">&lt;</button>
        <span id="pageNumbers"></span>
        <button type="button" class="table-navigation-button" id="nextPageBtn" aria-label="Next page">&gt;</button>
      </div>
    </div>
  </section>
  
  <!-- Student Form Modal -->
  <div class="modal-overlay" id="modalOverlay" aria-label="Student form overlay"></div>
  <div class="student-form-container" id="studentForm" aria-modal="true" role="dialog" aria-label="Student form modal">
    <div class="form-header">
      <h3 aria-label="Student form title">Add New Student</h3>
      <button type="button" class="close-button" id="closeFormBtn" aria-label="Close student form">&times;</button>
    </div>
    <form aria-label="Student form">
      <input type="hidden" id="studentId" name="student_id" value="">
      <div class="form-group">
        <label for="studentGroup">Group</label>
        <select id="studentGroup" name="group" required size="1" aria-label="Select group">
          <option value="" disabled selected>Select a group...</option>
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
        <label for="studentFirstName">First Name</label>
        <input type="text" id="studentFirstName" name="first_name"{{-- required pattern="^[A-Z][a-z\-']+$" --}}
        title="First Name must be between 2-20 characters and can only contain letters, apostrophes and hyphens" aria-label="First name">
      </div>
      <div class="form-group">
        <label for="studentLastName">Last Name</label>
        <input type="text" id="studentLastName" name="last_name"{{-- required pattern="^[A-Z][a-z\-']+$" --}}
        title="Last Name must be between 2-20 characters and can only contain letters, apostrophes and hyphens" aria-label="Last name">
      </div>
      <div class="form-group">
        <label for="studentGender">Gender</label>
        <select id="studentGender" name="gender" required size="1" aria-label="Select gender">
          <option value="" disabled selected>Select gender...</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>
      <div class="form-group">
        <label for="studentBirthdate">Birthday</label>
        <input type="date" format id="studentBirthdate" name="birthdate" {{-- required min="1945-01-01" max="2020-01-01" --}}
        title="The birthdate must be between 1945-01-01 and 2020-01-01" aria-label="Birthdate">
      </div>
      <div class="form-group">
        <label for="studentUsername">Username</label>
        <input type="text" id="studentUsername" name="username" required aria-label="Username">
      </div>
      <div id="generalErrors" class="validation-error" style="color: red; margin-bottom: 10px;"></div>
      <div class="form-buttons">
        <button type="button" class="cancel-btn" id="cancelBtn" aria-label="Cancel student form">Cancel</button>
        <button type="submit" class="submit-btn" aria-label="Submit student form">Create</button>
      </div>
    </form>
  </div>

  <!-- Delete Confirmation Modal -->
  <div class="modal-overlay" id="deleteModalOverlay" aria-label="Delete confirmation overlay"></div>
  <div class="delete-modal-container" id="deleteModal" aria-modal="true" role="dialog" aria-label="Delete confirmation modal">
    <div class="form-header">
      <h3 aria-label="Delete confirmation title">Warning</h3>
      <button type="button" class="close-button" id="closeDeleteModalBtn" aria-label="Close delete confirmation">&times;</button>
    </div>
    <div class="delete-modal-content">
      <p id="deleteConfirmationMessage" aria-label="Delete confirmation message">Are you sure you want to delete this student?</p>
    </div>
    <div class="form-buttons">
      <button type="button" class="cancel-btn" id="cancelDeleteBtn" aria-label="Cancel delete">Cancel</button>
      <button type="button" class="submit-btn" id="confirmDeleteBtn" aria-label="Confirm delete">OK</button>
    </div>
  </div>

  <script type="module" src="{{ asset('js/pagination.js') }}"></script>
  <script type="module" src="{{ asset('js/students/form.js') }}"></script>
  <script type="module" src="{{ asset('js/students/delete.js') }}"></script>
</body>

</html>