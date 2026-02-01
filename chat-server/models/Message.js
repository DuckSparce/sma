const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
  from: String, // student id or username
  to: String,   // student id, group id, or 'all'
  text: String,
  timestamp: { type: Date, default: Date.now },
  unreadBy: { type: [String], default: [] }
});
module.exports = mongoose.model('Message', MessageSchema);