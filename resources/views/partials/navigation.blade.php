<nav class="navigation-menu">
  <ul>
    <li>
      <a href="{{ url('dashboard') }}" class="{{ request()->is('dashboard') ? 'active-item' : '' }}">
        <span class="material-icons">dashboard</span>
        <span class="nav-text"> Dashboard</span>
      </a>
    </li>
    <li>
      <a href="{{ url('students') }}" class="{{ request()->is('students') ? 'active-item' : '' }}">
        <span class="material-icons">group</span>
        <span class="nav-text"> Students</span>
      </a>
    </li>
    <li>
      <a href="{{ url('messages') }}" class="{{ request()->is('messages') ? 'active-item' : '' }}">
        <span class="material-icons">message</span>
        <span class="nav-text"> Messages</span>
      </a>
    </li>
    <li>
      <a href="{{ url('tasks') }}" class="{{ request()->is('tasks') ? 'active-item' : '' }}">
        <span class="material-icons">assignment</span>
        <span class="nav-text"> Tasks</span>
      </a>
    </li>
  </ul>
</nav>