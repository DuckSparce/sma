import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";
const socket = io('http://localhost:3001');

let studentId = window.loggedStudentId;
let group = window.loggedStudentGroup;
const studentIdNameMap = window.studentIdNameMap || {};
const myName = window.loggedStudentName || "Me";

// Parse ?room=... from URL
function getRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

let currentRoom = getRoomFromUrl() || group; // Use URL param if present, else default

console.log('Student ID:', studentId, 'Group:', group, 'Current Room:', currentRoom);

// Join initial rooms
socket.emit('join', { studentId, group });

async function loadChatRooms() {
  const chatRoomList = document.getElementById('chatRoomList');
  if (!chatRoomList) return;
  chatRoomList.innerHTML = '<div style="color:#888;padding:10px;">Loading...</div>';
  try {
    const res = await fetch(`http://localhost:3001/chat-rooms/${studentId}`);
    const rooms = await res.json();
    // Filter out template strings and empty names
    const filteredRooms = rooms.filter(room =>
      room && !room.includes('{{') && room !== ''
    );
    
    chatRoomList.innerHTML = '';
    let firstRoom = null;
    let firstDisplayName = null;
    let foundRoom = false;

    // Additional check: verify user has access to each room
    for (const room of filteredRooms) {
      let hasAccess = true;
      
      // Check if it's a chat group and verify membership
      try {
        const memberRes = await fetch(`http://localhost:3001/groups/${room}/members`);
        if (memberRes.ok) {
          const members = await memberRes.json();
          hasAccess = members.includes(String(studentId));
        }
      } catch (e) {
        // Not a chat group, assume it's accessible (private chat, student group, etc.)
        hasAccess = true;
      }
      
      if (!hasAccess) continue; // Skip this room if user doesn't have access
      
      // Display group name or user name
      let displayName = room;
      if (studentIdNameMap[room]) {
        displayName = studentIdNameMap[room];
      } else if (room === group) {
        displayName = "Group " + group;
      }
      
      // Set first room if not set yet
      if (!firstRoom) {
        firstRoom = room;
        firstDisplayName = displayName;
      }

      // If currentRoom is not in filteredRooms, fallback to firstRoom
      if (room === currentRoom) {
        foundRoom = true;
      }

      const btn = document.createElement('button');
      // Properly check if this room should be active
      // --- FIX: highlight the current room after DOM is loaded ---
      // We'll set the active class after all buttons are created below
      btn.className = 'chat-room-item';
      btn.innerHTML = `<span class="material-icons">account_circle</span><span>${escapeHtml(displayName)}</span>`;
      btn.onclick = () => switchRoom(room, displayName);
      btn.dataset.roomId = room;
      chatRoomList.appendChild(btn);
    }

    // If the requested room is not found, fallback to first available room
    if (!foundRoom && firstRoom) {
      currentRoom = firstRoom;
    }

    // Update chat header with current room
    const chatRoomTitle = document.querySelector('.chat-room-title');
    let displayName = studentIdNameMap[currentRoom] || (currentRoom === group ? "Group " + group : currentRoom);
    if (chatRoomTitle) chatRoomTitle.textContent = `Chat room ${displayName}`;

    // --- FIX: Highlight the current room in the sidebar after all buttons are created ---
    Array.from(chatRoomList.children).forEach(btn => {
      if (btn.dataset.roomId === currentRoom) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

  } catch (e) {
    chatRoomList.innerHTML = '<div style="color:#e63946;padding:10px;">Failed to load chat rooms</div>';
  }
}

// --- Add Student Modal Logic ---
const addStudentModal = document.getElementById('addStudentModal');
const cancelAddStudentBtn = document.getElementById('cancelAddStudentBtn');
const addStudentForm = document.getElementById('addStudentForm');
const addStudentListDiv = document.getElementById('addStudentList');
const addStudentErrorDiv = document.getElementById('addStudentError');

// Open add student modal
function openAddStudentModal(groupName) {
  if (!addStudentModal) return;
  
  addStudentModal.style.display = 'flex';
  addStudentErrorDiv.textContent = '';
  addStudentForm.dataset.groupName = groupName;
  
  // Fetch students from Laravel API and current group members
  addStudentListDiv.innerHTML = 'Loading...';
  
  Promise.all([
    fetch('/api/students'),
    fetch(`http://localhost:3001/groups/${groupName}/members`)
  ]).then(async ([studentsRes, membersRes]) => {
    const students = await studentsRes.json();
    const currentMembers = membersRes.ok ? await membersRes.json() : [];
    
    addStudentListDiv.innerHTML = '';
    
    students.forEach(stu => {
      const id = String(stu.id);
      // Skip if student is already a member or is the current user
      if (currentMembers.includes(id) || id == studentId) return;
      
      const label = document.createElement('label');
      label.style.display = 'block';
      label.style.marginBottom = '5px';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = id;
      checkbox.style.marginRight = '8px';
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(`${stu.first_name} ${stu.last_name} (${stu.group})`));
      addStudentListDiv.appendChild(label);
    });
    
    if (addStudentListDiv.children.length === 0) {
      addStudentListDiv.innerHTML = '<div style="color:#888;padding:10px;">No available students to add</div>';
    }
  }).catch(e => {
    addStudentListDiv.innerHTML = '<div style="color:#e63946;padding:10px;">Failed to load students</div>';
  });
}

// Add click handler for "+" button in members list
function attachAddStudentHandler() {
  const addBtn = document.querySelector('.chat-member-add');
  if (addBtn && !addBtn.dataset.handlerAttached) {
    addBtn.dataset.handlerAttached = 'true';
    addBtn.onclick = () => {
      openAddStudentModal(currentRoom);
    };
  }
}

// Track the latest requested room for members bar to avoid race conditions
let latestMembersBarRoom = null;

async function updateMembersBar(room) {
  const membersList = document.getElementById('chatMembersList');
  const membersCount = document.getElementById('chatMembersCount');
  if (!membersList || !membersCount) return;

  // Track which room this update is for
  latestMembersBarRoom = room;

  // Remove the initial placeholder if present (always remove any <div> with height:36px)
  if (membersList.firstElementChild && membersList.firstElementChild.style && membersList.firstElementChild.style.height === "36px") {
    membersList.innerHTML = '';
  }

  // Check if it's an actual chat group by trying to fetch its members
  // Only fetch if the room doesn't look like a student group (PZ-XX format) or user ID
  const isStudentGroup = /^PZ-\d{2}$/.test(room);
  const isUserId = studentIdNameMap[room] || room == studentId;
  
  if (!isStudentGroup && !isUserId) {
    try {
      // Try to get group members from backend for actual chat groups
      const res = await fetch(`http://localhost:3001/groups/${room}/members`);
      if (res.ok) {
        // --- RACE CONDITION FIX: Only update if still the latest requested room ---
        if (latestMembersBarRoom !== room) return;
        const members = await res.json();
        membersList.innerHTML = '';
        membersCount.textContent = members.length;
        
        // Fetch status information for all members
        let memberStatuses = {};
        try {
          const statusRes = await fetch('/api/students');
          if (statusRes.ok) {
            const students = await statusRes.json();
            students.forEach(student => {
              memberStatuses[student.id] = student.status;
            });
          }
        } catch (e) {
          console.warn('Could not fetch user statuses');
        }
        
        members.forEach(id => {
          const span = document.createElement('span');
          span.className = 'material-icons';
          span.textContent = 'account_circle';
          span.title = studentIdNameMap[id] || id;
          span.style.position = 'relative';
          
          // Add status indicator if user is active
          if (memberStatuses[id] === 'active') {
            const statusDot = document.createElement('span');
            statusDot.style.cssText = `
              position: absolute;
              bottom: 2px;
              right: 2px;
              width: 8px;
              height: 8px;
              background-color: #22c55e;
              border: 1px solid #fff;
              border-radius: 50%;
            `;
            span.appendChild(statusDot);
          }
          
          membersList.appendChild(span);
        });
        // Add "add" icon only for actual chat groups
        const addSpan = document.createElement('span');
        addSpan.className = 'material-icons chat-member-add';
        addSpan.textContent = 'add';
        membersList.appendChild(addSpan);
        
        // Attach click handler for add button
        setTimeout(attachAddStudentHandler, 100);
        return;
      }
    } catch (e) {
      // Not a chat group or error, fall through to handle as student group/private chat
    }
  }

  // Handle student groups or private chats
  // Before updating DOM, check again
  if (latestMembersBarRoom !== room) return;

  membersList.innerHTML = '';
  let ids = [];
  
  if (isStudentGroup) {
    // For student groups, show all students in that group
    // You might want to fetch this from your Laravel API
    ids = [studentId]; // For now, just show current user
  } else if (studentIdNameMap[room]) {
    // Private chat with another user
    ids = [studentId, room];
  } else {
    // Fallback: just show self
    ids = [studentId];
  }
  
  membersCount.textContent = ids.length;
  
  // Fetch status information for members
  let memberStatuses = {};
  try {
    const statusRes = await fetch('/api/students');
    if (statusRes.ok) {
      const students = await statusRes.json();
      students.forEach(student => {
        memberStatuses[student.id] = student.status;
      });
    }
  } catch (e) {
    console.warn('Could not fetch user statuses');
  }
  
  ids.forEach(id => {
    const span = document.createElement('span');
    span.className = 'material-icons';
    span.textContent = 'account_circle';
    span.title = (id == studentId ? myName : (studentIdNameMap[id] || id));
    span.style.position = 'relative';
    
    // Add status indicator if user is active
    if (memberStatuses[id] === 'active') {
      const statusDot = document.createElement('span');
      statusDot.style.cssText = `
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 8px;
        height: 8px;
        background-color: #22c55e;
        border: 1px solid #fff;
        border-radius: 50%;
      `;
      span.appendChild(statusDot);
    }
    
    membersList.appendChild(span);
  });
  
  // Don't add "add" button for student groups or private chats
}

// Close add student modal
if (cancelAddStudentBtn) {
  cancelAddStudentBtn.onclick = () => {
    addStudentModal.style.display = 'none';
    addStudentErrorDiv.textContent = '';
  };
}

// Handle adding students to group
if (addStudentForm) {
  addStudentForm.onsubmit = async (e) => {
    e.preventDefault();
    addStudentErrorDiv.textContent = '';
    
    const groupName = addStudentForm.dataset.groupName;
    const checkedStudents = Array.from(addStudentListDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    
    if (checkedStudents.length === 0) {
      addStudentErrorDiv.textContent = 'Please select at least one student to add.';
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:3001/groups/${groupName}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: checkedStudents })
      });
      
      if (!res.ok) {
        const data = await res.json();
        addStudentErrorDiv.textContent = data.error || 'Failed to add students';
        return;
      }
      
      addStudentModal.style.display = 'none';
      // Refresh the members bar to show new members
      updateMembersBar(currentRoom);
    } catch (e) {
      addStudentErrorDiv.textContent = 'Failed to add students';
    }
  };
}

// Store unread message IDs for the current user in the current room
let unreadMessageIds = new Set();
let unreadMessageIdsLoadedAt = null;

// Fetch unread message IDs for the current user and room
async function fetchUnreadMessageIds(roomId) {
  if (!studentId || !roomId) return;
  try {
    const res = await fetch(`http://localhost:3001/api/messages/unread/${studentId}`);
    if (!res.ok) return;
    const messages = await res.json();
    // Only messages for this room
    unreadMessageIds = new Set(
      messages.filter(msg => String(msg.to) === String(roomId)).map(msg => String(msg._id))
    );
    // Record the time when unread IDs were loaded (for this room)
    unreadMessageIdsLoadedAt = Date.now();
  } catch (e) {
    unreadMessageIds = new Set();
    unreadMessageIdsLoadedAt = null;
  }
}

async function switchRoom(room, displayName) {
  if (room === currentRoom) return;

  // --- FIX: Add placeholder BEFORE clearing/loading messages ---
  const membersList = document.getElementById('chatMembersList');
  if (membersList) {
    membersList.innerHTML = '<div style="height:36px"></div>';
  }

  // --- RACE CONDITION FIX: Set latestMembersBarRoom to this room before updating ---
  latestMembersBarRoom = room;

  // Leave the current room and join the new one
  if (currentRoom) {
    socket.emit('leaveRoom', currentRoom);
  }
  socket.emit('joinRoom', room);
  currentRoom = room;

  // Highlight active room - improved logic
  document.querySelectorAll('.chat-room-item').forEach(btn => btn.classList.remove('active'));
  const chatRoomList = document.getElementById('chatRoomList');
  Array.from(chatRoomList.children).forEach(btn => {
    const buttonTextSpan = btn.querySelector('span:last-child');
    if (buttonTextSpan && buttonTextSpan.textContent.trim() === displayName) {
      btn.classList.add('active');
    }
  });

  // Update chat header
  const chatRoomTitle = document.querySelector('.chat-room-title');
  if (chatRoomTitle) chatRoomTitle.textContent = displayName ? `Chat room ${displayName}` : 'Chat';

  // Fetch unread message IDs for this room before loading messages
  await fetchUnreadMessageIds(room);

  // Clear and load messages for the selected room
  const chatBox = document.querySelector('.chat-messages');
  if (chatBox) chatBox.innerHTML = '';
  try {
    const res = await fetch(`http://localhost:3001/messages/${room}`);
    const messages = await res.json();
    messages.forEach(msg => {
      // Only highlight if message was unread at the time of entering the room
      const isUnread = unreadMessageIds.has(String(msg._id));
      appendMessage(msg, msg.from == studentId, isUnread);
    });
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  } catch (e) {
    if (chatBox) chatBox.innerHTML = '<div style="color:#e63946;padding:10px;">Failed to load messages</div>';
  }

  // Update members bar (this will remove the placeholder)
  updateMembersBar(room);

  // Remove notifications for this room when entering it (marks as read on server)
  if (window.removeNotificationsForRoom) {
    await window.removeNotificationsForRoom(room);
  } else {
    window.dispatchEvent(new CustomEvent('clear-notifications-for-room', { detail: { roomId: room } }));
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadChatRooms();

  // --- FIX: Add placeholder BEFORE loading messages and members ---
  const membersList = document.getElementById('chatMembersList');
  if (membersList) {
    membersList.innerHTML = '<div style="height:36px"></div>';
  }

  // --- RACE CONDITION FIX: Set latestMembersBarRoom to initial room ---
  latestMembersBarRoom = currentRoom;

  // Fetch unread message IDs for the initial room
  await fetchUnreadMessageIds(currentRoom);

  // Make sure we have a current room and join it
  if (currentRoom) {
    console.log('Joining room on page load:', currentRoom);
    socket.emit('join', { studentId, group: currentRoom });
    socket.emit('joinRoom', currentRoom);
  }

  // Load messages for the current room (which is now set to first available room or URL param)
  const chatBox = document.querySelector('.chat-messages');
  if (chatBox) chatBox.innerHTML = '';
  try {
    const res = await fetch(`http://localhost:3001/messages/${currentRoom}`);
    const messages = await res.json();
    messages.forEach(msg => {
      // Only highlight if message was unread at the time of entering the room
      const isUnread = unreadMessageIds.has(String(msg._id));
      appendMessage(msg, msg.from == studentId, isUnread);
    });
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  } catch (e) {
    if (chatBox) chatBox.innerHTML = '<div style="color:#e63946;padding:10px;">Failed to load messages</div>';
  }
  // Update members bar for current room (this will remove the placeholder)
  updateMembersBar(currentRoom);

  // Remove notifications for the initial room on page load (marks as read on server)
  if (window.removeNotificationsForRoom && currentRoom) {
    await window.removeNotificationsForRoom(currentRoom);
  } else if (currentRoom) {
    window.dispatchEvent(new CustomEvent('clear-notifications-for-room', { detail: { roomId: currentRoom } }));
  }
});

document.getElementById('chatForm').onsubmit = function(e) {
  e.preventDefault();
  const text = document.getElementById('chatInput').value;
  if (!text.trim()) return;
  
  console.log('Sending message to room:', currentRoom, 'Message:', text);
  const msg = { from: studentId, to: currentRoom, text, timestamp: new Date() };
  
  // Send to server
  socket.emit('sendMessage', msg);
  document.getElementById('chatInput').value = '';
};

// Listen for incoming messages with better debugging
socket.on('receiveMessage', (msg) => {
  console.log('Received message:', msg);
  console.log('Current room:', currentRoom);
  console.log('Message is for current room:', msg.to == currentRoom);
  
  // Append message if it's for the current room
  if (msg.to == currentRoom) {
    appendMessage(msg, msg.from == studentId);
  }
});

// Add better connection debugging
socket.on('connect', () => {
  console.log('Connected to chat server with socket ID:', socket.id);
  // Join initial rooms on connection
  socket.emit('join', { studentId, group });
  if (currentRoom) {
    socket.emit('joinRoom', currentRoom);
  }
});

socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Update appendMessage to accept isUnread
function appendMessage(msg, isMe, isUnread) {
  const chatBox = document.querySelector('.chat-messages');
  if (!chatBox) return;
  // Only highlight unread messages if they are NOT sent by the current user
  const highlightUnread = isUnread && !isMe;
  const row = document.createElement('div');
  row.className = 'chat-message-row' + (isMe ? ' chat-message-row-me' : '') + (highlightUnread ? ' chat-message-row-unread' : '');
  const authorName = isMe
    ? "Me"
    : (studentIdNameMap[msg.from] || msg.from);

  // Format timestamp
  let timestamp = '';
  if (msg.timestamp) {
    const date = new Date(msg.timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    timestamp = `<span class="chat-message-timestamp">${hours}:${minutes}</span>`;
  }

  // Add a class for unread messages (bubble)
  const unreadClass = highlightUnread ? ' chat-message-unread' : '';

  if (isMe) {
    row.innerHTML = `
      <div style="display: flex; align-items: flex-end; flex-direction: row-reverse; gap: 3px;">
        <div>
          <div class="chat-message-author chat-message-author-me">${escapeHtml(myName)}</div>
          <div class="chat-message-bubble chat-message-bubble-me">${escapeHtml(msg.text)}</div>
        </div>
        ${timestamp}
      </div>
      <span class="material-icons chat-message-avatar">account_circle</span>
    `;
  } else {
    row.innerHTML = `
      <span class="material-icons chat-message-avatar">account_circle</span>
      <div style="display: flex; align-items: flex-end; gap: 3px;">
        <div>
          <div class="chat-message-author">${escapeHtml(authorName)}</div>
          <div class="chat-message-bubble chat-message-bubble-other${unreadClass}">${escapeHtml(msg.text)}</div>
        </div>
        ${timestamp}
      </div>
    `;
  }
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Remove the unread highlight after animation completes (2.5s)
  if (highlightUnread) {
    setTimeout(() => {
      row.classList.remove('chat-message-row-unread');
    }, 1500);
  }
}

// Simple HTML escaping
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m];
  });
}

// --- New Group Modal Logic ---
const newGroupBtn = document.getElementById('newChatRoomBtn');
const newGroupModal = document.getElementById('newGroupModal');
const cancelNewGroupBtn = document.getElementById('cancelNewGroupBtn');
const newGroupForm = document.getElementById('newGroupForm');
const studentListDiv = document.getElementById('studentList');
const groupErrorDiv = document.getElementById('groupError');

// Open modal
if (newGroupBtn) {
  newGroupBtn.onclick = async () => {
    newGroupModal.style.display = 'flex';
    groupErrorDiv.textContent = '';
    // Fetch students from Laravel API
    studentListDiv.innerHTML = 'Loading...';
    try {
      const res = await fetch('/api/students');
      const students = await res.json();
      studentListDiv.innerHTML = '';
      students.forEach(stu => {
        const id = stu.id;
        // Do not show current user in the list
        if (id == studentId) return;
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '5px';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = id;
        checkbox.style.marginRight = '8px';
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(`${stu.first_name} ${stu.last_name} (${stu.group})`));
        studentListDiv.appendChild(label);
      });
    } catch (e) {
      studentListDiv.innerHTML = 'Failed to load students';
    }
  };
}

// Close modal
if (cancelNewGroupBtn) {
  cancelNewGroupBtn.onclick = () => {
    newGroupModal.style.display = 'none';
    groupErrorDiv.textContent = '';
  };
}

// Handle group creation
if (newGroupForm) {
  newGroupForm.onsubmit = async (e) => {
    e.preventDefault();
    groupErrorDiv.textContent = '';
    const groupName = newGroupForm.groupName.value.trim();
    let checked = Array.from(studentListDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    // Always add current user to the group
    if (!checked.includes(String(studentId))) {
      checked.unshift(String(studentId));
    }
    if (!groupName) {
      groupErrorDiv.textContent = 'Please enter a group name.';
      return;
    }
    // Allow empty checked array for draft groups (but will always include current user)
    try {
      const res = await fetch('http://localhost:3001/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, members: checked })
      });
      if (!res.ok) {
        const data = await res.json();
        groupErrorDiv.textContent = data.error || 'Failed to create group';
        return;
      }
      newGroupModal.style.display = 'none';
      await loadChatRooms();
    } catch (e) {
      groupErrorDiv.textContent = 'Failed to create group';
    }
  };
}