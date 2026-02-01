import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

const studentId = window.loggedStudentId;
const currentPage = document.body.getAttribute('data-page');
const badge = document.getElementById('newMessagesBadge');
const notificationList = document.querySelector('.notification-list');
const notificationsContainer = document.querySelector('.notifications-container');
const notificationsIcon = notificationsContainer?.querySelector('.material-icons');
const MAX_NOTIFICATIONS = 3;

function getStorageKey() {
  return `sma_last_messages_${studentId}`;
}

function getLastMessages() {
  try {
    const arr = JSON.parse(localStorage.getItem(getStorageKey()));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function setLastMessages(arr) {
  localStorage.setItem(getStorageKey(), JSON.stringify(arr.slice(0, MAX_NOTIFICATIONS)));
}

function formatTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getRoomDisplayName(room) {
  if (window.studentIdNameMap && window.studentIdNameMap[room]) {
    return window.studentIdNameMap[room];
  }
  // If it's a group (e.g., PZ-21), show as "Group PZ-21"
  if (/^PZ-\d{2}$/.test(room)) {
    return `Group ${room}`;
  }
  return room;
}

// Wait for DOM and studentIdNameMap to be ready before rendering notifications
function ensureStudentIdNameMapReady(callback) {
  if (window.studentIdNameMap && Object.keys(window.studentIdNameMap).length > 0) {
    callback();
    return;
  }
  // Try to fetch from API if not present
  fetch('/api/students')
    .then(res => res.json())
    .then(students => {
      window.studentIdNameMap = {};
      students.forEach(stu => {
        window.studentIdNameMap[String(stu.id)] = `${stu.first_name} ${stu.last_name}`;
      });
      callback();
    })
    .catch(() => {
      window.studentIdNameMap = {};
      callback();
    });
}

function renderNotifications() {
  if (!notificationList) return;
  ensureStudentIdNameMapReady(() => {
    const messages = getLastMessages();
    notificationList.innerHTML = '';
    if (messages.length === 0) {
      notificationList.innerHTML = `<div class="notification-item"><div class="notification-content"><p class="notification-text" style="color:#888;">No new messages</p></div></div>`;
      updateBadgeVisibility();
      return;
    }
    messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'notification-item';
      div.style.cursor = 'pointer';
      // Redirect to messages page with ?room=roomId on click
      div.onclick = (e) => {
        e.stopPropagation();
        window.location.href = `/messages?room=${encodeURIComponent(msg.to)}`;
      };
      // Always use studentIdNameMap[msg.from] for sender name, cast to string for lookup
      const senderId = String(msg.from);
      const senderName = window.studentIdNameMap[senderId] || senderId || 'Unknown';
      const roomName = escapeHtml(getRoomDisplayName(msg.to));
      const time = formatTime(msg.timestamp);
      div.innerHTML = `
        <div class="notification-content">
          <p class="notification-user">
            ${escapeHtml(senderName)}
            <span style="color:#888;font-size:12px;">in ${roomName}</span>
          </p>
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span class="notification-text" style="margin-right:10px;">${escapeHtml(msg.text)}</span>
            <span style="color:#888;font-size:12px; white-space:nowrap;">${time}</span>
          </div>
        </div>
      `;
      notificationList.appendChild(div);
    });
    updateBadgeVisibility();
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function showBadge() {
  if (badge) {
    badge.classList.remove('hidden');
    badge.classList.add('visible');
    badge.style.display = 'inline-block';
  }
}

function hideBadge() {
  if (badge) {
    badge.classList.add('hidden');
    badge.classList.remove('visible');
    badge.style.display = 'none';
  }
}

function animateBell() {
  if (!notificationsIcon) return;
  notificationsIcon.classList.add('bell-animate');
  setTimeout(() => notificationsIcon.classList.remove('bell-animate'), 700);
}

// Add bell animation CSS if not present
if (!document.getElementById('bell-animate-style')) {
  const style = document.createElement('style');
  style.id = 'bell-animate-style';
  style.innerHTML = `
    @keyframes bellRing {
      0% { transform: rotate(0deg);}
      15% { transform: rotate(20deg);}
      30% { transform: rotate(-20deg);}
      45% { transform: rotate(15deg);}
      60% { transform: rotate(-10deg);}
      80% { transform: rotate(5deg);}
      100% { transform: rotate(0deg);}
    }
    .bell-animate {
      animation: bellRing 0.7s;
    }
  `;
  document.head.appendChild(style);
}

// Helper to get the currently open chat room (if on messages page)
function getCurrentChatRoom() {
  // Try to get from a global variable or DOM if available
  if (window.currentRoom) return window.currentRoom;
  // Try to get from DOM (if messages.js sets it as a data attribute)
  const chatMain = document.querySelector('.chat-main');
  if (chatMain && chatMain.dataset && chatMain.dataset.room) {
    return chatMain.dataset.room;
  }
  // Try to get from the active chat room button (fallback)
  const activeBtn = document.querySelector('.chat-room-item.active span:last-child');
  if (activeBtn) {
    // Try to map display name back to room id if needed
    return activeBtn.textContent.trim();
  }
  return null;
}

if (studentId) {
  const socket = io('http://localhost:3001');

  // Join all accessible rooms immediately after page load
  async function joinAllRooms() {
    try {
      const res = await fetch(`http://localhost:3001/chat-rooms/${studentId}`);
      const rooms = await res.json();
      rooms.forEach(room => {
        socket.emit('joinRoom', room);
      });
    } catch (e) {
      // Ignore errors
    }
  }

  // Join all rooms as soon as possible
  joinAllRooms();

  socket.on('connect', () => {
    joinAllRooms();
  });

  // Listen for new messages in any room
  socket.on('receiveMessage', (msg) => {
    // Do not notify for own messages
    if (String(msg.from) === String(studentId)) return;

    // Determine if user is in the chat where the message was sent
    let isInSameChat = false;
    if (currentPage === 'messages') {
      const openRoom = getCurrentChatRoom();
      if (openRoom && String(openRoom) === String(msg.to)) {
        isInSameChat = true;
      }
    }

    // Only show badge and save notification if not in the same chat as the message
    if (!isInSameChat) {
      showBadge();
      animateBell();

      const fromName = (window.studentIdNameMap && window.studentIdNameMap[msg.from]) || msg.from;
      const newMsg = {
        from: msg.from,
        fromName,
        to: msg.to,
        text: msg.text,
        timestamp: msg.timestamp
      };
      let arr = getLastMessages();
      arr = arr.filter(m => !(m.timestamp === newMsg.timestamp && m.from === newMsg.from && m.to === newMsg.to && m.text === newMsg.text));
      arr.unshift(newMsg);
      setLastMessages(arr);
      renderNotifications();
    }
    // If user is in the same chat, do NOT show badge or save notification
  });
}

// Hide badge on messages page and clear notifications
if (currentPage === 'messages') {
  hideBadge();
  setLastMessages([]);
  renderNotifications();
} else {
  hideBadge(); // Hide by default, only show on new message
  renderNotifications();
}

// Always render notifications on page load
renderNotifications();

// Render notifications on popup open (hover/focus)
if (notificationsContainer) {
  notificationsContainer.addEventListener('mouseenter', renderNotifications);
  notificationsContainer.addEventListener('focusin', renderNotifications);
}

// Listen for a custom event 'new-message-received'
window.addEventListener('new-message-received', function() {
  showBadge();
});

// Fetch unread messages for the user from the chat server and store as notifications
async function fetchAndStoreUnreadNotifications() {
  if (!studentId) return;
  try {
    // Fetch from Node.js chat server (MongoDB)
    const res = await fetch(`http://localhost:3001/api/messages/unread/${studentId}`);
    if (!res.ok) return;
    const messages = await res.json();
    // Only keep the latest MAX_NOTIFICATIONS
    const notifications = messages
      .filter(msg => String(msg.from) !== String(studentId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, MAX_NOTIFICATIONS);
    setLastMessages(notifications);
    renderNotifications();
  } catch (e) {
    // Ignore errors
  }
}

// Remove all notifications for a specific chat room and mark them as read on the server
async function removeNotificationsForRoom(roomId) {
  let arr = getLastMessages();
  arr = arr.filter(msg => String(msg.to) !== String(roomId));
  setLastMessages(arr);
  renderNotifications();

  // Mark messages as read on the server (MongoDB)
  if (window.loggedStudentId && roomId) {
    try {
      await fetch('http://localhost:3001/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: window.loggedStudentId, roomId })
      });
    } catch (e) {
      // Ignore errors
    }
  }
}

// Listen for custom event to clear notifications for a room
window.addEventListener('clear-notifications-for-room', function(e) {
  if (e && e.detail && e.detail.roomId) {
    removeNotificationsForRoom(e.detail.roomId);
  }
});

// Show/hide badge based on whether there are notifications
function updateBadgeVisibility() {
  const messages = getLastMessages();
  if (messages.length > 0) {
    showBadge();
  } else {
    hideBadge();
  }
}

// Listen for page visibility changes or navigation to update badge
window.addEventListener('pageshow', updateBadgeVisibility);
window.addEventListener('focus', updateBadgeVisibility);

// Also update badge on initial load and after clearing notifications
updateBadgeVisibility();

// On initial load, fetch unread notifications from backend
if (studentId) {
  fetchAndStoreUnreadNotifications();
}
