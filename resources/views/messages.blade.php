<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="author" content="Artem Kachur" />
  <meta name="description" content="A basic student management system" />
  <meta name="keywords" content="students, cms, management" />
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Messages</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/page.css') }}">
  <link rel="stylesheet" href="{{ asset('css/header.css') }}">
  <link rel="stylesheet" href="{{ asset('css/navigation.css') }}">
  <link rel="stylesheet" href="{{ asset('css/messages.css') }}">
</head>

<body data-page="messages">
  
  @if(!session('student_id'))
    <script>
      // Redirect to register page if user is not logged in
      window.location.href = '/login';
    </script>
  @endif

  @include('partials.header')

  <section class="content-page">
    @include('partials.navigation')

    <div class="content-container">
      <h2 class="page-title">Messages</h2>
      <div class="chat-layout">
        <!-- Sidebar: Chat Rooms -->
        <div class="chat-sidebar">
          <div class="chat-sidebar-header">
            <span>Chat room</span>
            <button class="btn btn-link" id="newChatRoomBtn">+ New chat room</button>
          </div>
          <div class="chat-room-list" id="chatRoomList">
            <!-- Chat rooms will be loaded dynamically -->
          </div>
        </div>
        <!-- Main Chat Area -->
        <div class="chat-main">
          <div class="chat-main-header">
            <div class="chat-room-title">Chat room Admin</div>
            <div class="chat-members-block">
              <span class="chat-members-label">
                Members (<span id="chatMembersCount">0</span>)
              </span>
              <div class="chat-members-list" id="chatMembersList">
                <!-- Member avatars will be loaded dynamically -->
                <div style="height:36px"></div>
              </div>
            </div>
            <div class="chat-messages-label">Messages</div>
          </div>
          <div class="chat-messages">
            <!-- Messages will be loaded dynamically -->
          </div>
          <form id="chatForm" class="chat-form">
            <input id="chatInput" autocomplete="off" placeholder="Type a message..." />
            <button type="submit">
              <span class="material-icons">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>

  <div id="newGroupModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.25); z-index:1000; align-items:center; justify-content:center;">
    <div style="background:#fff; border-radius:10px; padding:32px 28px; min-width:340px; max-width:95vw; box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <h3 style="margin-bottom:12px;">Create New Group</h3>
      <form id="newGroupForm">
        <div style="margin-bottom:12px;">
          <label for="groupName">Group Name</label>
          <input type="text" id="groupName" name="groupName" required style="width:100%;padding:8px;margin-top:4px;border-radius:6px;border:1px solid #bfc6e6;">
        </div>
        <div style="margin-bottom:12px;">
          <label>Select Members</label>
          <div id="studentList" style="max-height:180px;overflow-y:auto;border:1px solid #eee;padding:8px;border-radius:6px;background:#fafbfc;"></div>
        </div>
        <div id="groupError" style="color:#e63946;font-size:13px;margin-bottom:8px;"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button type="button" id="cancelNewGroupBtn" style="padding:7px 18px;border-radius:6px;border:none;background:#eee;">Cancel</button>
          <button type="submit" style="padding:7px 18px;border-radius:6px;border:none;background:var(--primary-color);color:#fff;font-weight:600;">Create</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Add Student to Group Modal -->
  <div id="addStudentModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.25); z-index:1000; align-items:center; justify-content:center;">
    <div style="background:#fff; border-radius:10px; padding:32px 28px; min-width:340px; max-width:95vw; box-shadow:0 8px 32px rgba(0,0,0,0.18);">
      <h3 style="margin-bottom:12px;">Add Students to Group</h3>
      <form id="addStudentForm">
        <div style="margin-bottom:12px;">
          <label>Select Students to Add</label>
          <div id="addStudentList" style="max-height:180px;overflow-y:auto;border:1px solid #eee;padding:8px;border-radius:6px;background:#fafbfc;"></div>
        </div>
        <div id="addStudentError" style="color:#e63946;font-size:13px;margin-bottom:8px;"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button type="button" id="cancelAddStudentBtn" style="padding:7px 18px;border-radius:6px;border:none;background:#eee;">Cancel</button>
          <button type="submit" style="padding:7px 18px;border-radius:6px;border:none;background:var(--primary-color);color:#fff;font-weight:600;">Add Students</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    window.loggedStudentId = @json(session('student_id'));
    window.loggedStudentGroup = @json($loggedStudent->group ?? '');
    window.loggedStudentName = @json(($loggedStudent->first_name ?? '') . ' ' . ($loggedStudent->last_name ?? ''));
    window.studentIdNameMap = @json(
      \App\Models\Student::all()->pluck('first_name', 'id')->map(function($first, $id) {
        $student = \App\Models\Student::find($id);
        return $student ? $student->first_name . ' ' . $student->last_name : '';
      })
    );
  </script>

  <script type="module" src="{{ asset('js/messages.js') }}"></script>
</body>
</html>
