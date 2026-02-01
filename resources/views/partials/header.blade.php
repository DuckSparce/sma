<header class="header">
  <div class="header-logo">
    <a href="students">SMA</a>
  </div>
  <div class="header-right">
    <div class="notifications-container">
      <div class="notifications" onclick="location.href='messages'">
        <span class="material-icons">notifications</span>
        <span class="notification-badge" id="newMessagesBadge" style="display:none;"></span>
      </div>
      <div class="notification-popup">
        <div class="notification-header">
          <h4>Notifications</h4>
          <a href="messages">View all</a>
        </div>
        <div class="notification-list">
          <div class="notification-item">
            <div class="notification-content">
              <p class="notification-user">Andrii Kityk</p>
              <p class="notification-text">New assignment added: Final Project</p>
            </div>
          </div>
          <div class="notification-item">
            <div class="notification-content">
              <p class="notification-user">Sarah Miller</p>
              <p class="notification-text">Your grade has been updated</p>
            </div>
          </div>
          <div class="notification-item">
            <div class="notification-content">
              <p class="notification-user">Vitalij Bahurskyj</p>
              <p class="notification-text">Reminder: Team meeting tomorrow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="header-profile">
      @if(session('student_id') && $loggedStudent)
        <span class="material-icons">account_circle</span>
        <span>{{ $loggedStudent->first_name }} {{ $loggedStudent->last_name }}</span>
        <div class="profile-dropdown">
          <div class="profile-dropdown-item">
            <span class="material-icons">account_circle</span>
            <span>Profile</span>
          </div>
          <form method="POST" action="/logout" style="margin:0;">
            @csrf
            <div class="profile-dropdown-item">
              <button type="submit" style="background:none;border:none;width:100%;text-align:left;cursor:pointer;">
                <span class="material-icons">logout</span>
                <span style="font-size: 17px; font-weight: 500;">Log out</span>
              </button>
            <div>
          </form>
        </div>
      @else
        <a href="/login" class="profile-login-btn" style="display:flex;align-items:center;gap:5px;text-decoration:none;">
          <span class="material-icons">login</span>
          <span>Log in</span>
        </a>
      @endif
    </div>
  </div>
</header>
<script type="module" src="{{ asset('js/notification-badge.js') }}"></script>