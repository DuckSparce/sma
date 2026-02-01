const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const Message = require('./models/Message');
const Group = require('./models/Group');
const Student = require('./models/Student');

mongoose.connect('mongodb://localhost:27017/sma_chat');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

const getGroupMembers = async (roomId, senderId) => {
  const group = await Group.findOne({ name: roomId });
  if (group) {
    // Exclude sender from unreadBy
    return group.members.filter(id => id !== senderId);
  }
  // Not a group, just a private chat
  return [roomId !== senderId ? roomId : null].filter(Boolean);
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ studentId, group }) => {
    socket.studentId = studentId;
      socket.join(studentId);
    if (group) {
      socket.join(group);
      console.log(`Student ${studentId} (${socket.id}) joined initial rooms: ${studentId}, ${group}`);
    }
    // Mark student as active in DB
    if (studentId) {
      Student.findByIdAndUpdate(studentId, { status: 'active' }).catch(() => {});
    }
  });

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} (student: ${socket.studentId}) joined room: ${room}`);
    console.log(`Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
  });

  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} (student: ${socket.studentId}) left room: ${room}`);
  });

  socket.on('sendMessage', async (msg) => {
    try {
      // Ensure timestamp is set
      if (!msg.timestamp) {
        msg.timestamp = new Date();
      }

      let unreadBy = [];
      if (msg.to && msg.from) {
        unreadBy = await getGroupMembers(msg.to, msg.from);
      }
      msg.unreadBy = unreadBy;
      
      const message = await Message.create(msg);
      console.log('Message saved:', {
        from: message.from,
        to: message.to,
        text: message.text,
        timestamp: message.timestamp
      });
      
      const socketsInRoom = await io.in(msg.to).fetchSockets();
      console.log(`Broadcasting to room "${msg.to}" with ${socketsInRoom.length} sockets:`, 
        socketsInRoom.map(s => `${s.id}(${s.studentId || 'unknown'})`));
      
      // Broadcast to all users in the target room
      io.to(msg.to).emit('receiveMessage', message);
      console.log(`Message broadcasted to room: ${msg.to}`);
      
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id, 'Student:', socket.studentId);
    // Mark student as inactive in DB
    if (socket.studentId) {
      try {
        await Student.findByIdAndUpdate(socket.studentId, { status: 'inactive' });
      } catch (e) {
        console.error('Error updating student status on disconnect:', e);
      }
    }
  });
});

app.get('/messages/:chatId', async (req, res) => {
  const messages = await Message.find({ to: req.params.chatId });
  res.json(messages);
});

app.get('/chat-rooms/:studentId', async (req, res) => {
  const studentId = req.params.studentId;
  const sentRooms = await Message.distinct('to', { from: studentId });
  const receivedRooms = await Message.distinct('to', { to: studentId });
  const groupRooms = await Message.distinct('to', { to: { $ne: studentId }, from: { $ne: studentId } });
  
  // Only get groups where the student is a member
  const memberGroups = await Group.find({ members: studentId }).distinct('name');
  
  // Combine and deduplicate, but filter out groups where user is not a member
  const allRooms = Array.from(new Set([...sentRooms, ...receivedRooms, ...groupRooms, ...memberGroups]))
    .filter(room => {
      // If it's a group name that exists in database, check if user is member
      if (memberGroups.includes(room)) {
        return true; // User is member of this group
      }
      // For non-group rooms (private chats, student groups), allow them
      return true;
    });

  // Further filter to only include groups where user is actually a member
  const finalRooms = [];
  for (const room of allRooms) {
    const group = await Group.findOne({ name: room });
    if (group) {
      // It's a chat group - only include if user is member
      if (group.members.includes(studentId)) {
        finalRooms.push(room);
      }
    } else {
      // It's not a chat group (private chat, student group, etc.) - include it
      finalRooms.push(room);
    }
  }

  res.json(finalRooms);
});

app.post('/groups', async (req, res) => {
  try {
    const { groupName, members } = req.body;
    if (!groupName) {
      return res.status(400).json({ error: 'Group name required' });
    }
    // Allow empty members array for drafts
    let group = await Group.findOne({ name: groupName });
    if (group) {
      return res.status(409).json({ error: 'Group already exists' });
    }
    group = await Group.create({ name: groupName, members: Array.isArray(members) ? members : [] });
    res.json(group);
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.post('/groups/:groupName/add', async (req, res) => {
  const { members } = req.body;
  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: 'Members required' });
  }
  const group = await Group.findOneAndUpdate(
    { name: req.params.groupName },
    { $addToSet: { members: { $each: members } } },
    { new: true }
  );
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
});

app.get('/groups/:groupName/members', async (req, res) => {
  const group = await Group.findOne({ name: req.params.groupName });
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group.members);
});

app.get('/api/messages/unread/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    // Only fetch messages where unreadBy contains the user
    const messages = await Message.find({
      unreadBy: studentId
    }).sort({ timestamp: -1 }).lean();
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages/mark-read', async (req, res) => {
  try {
    const { studentId, roomId } = req.body;
    if (!studentId || !roomId) return res.status(400).json({ error: 'studentId and roomId required' });
    await Message.updateMany(
      { to: roomId, unreadBy: studentId },
      { $pull: { unreadBy: studentId } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

server.listen(3001, () => console.log('Chat server running on port 3001'));
