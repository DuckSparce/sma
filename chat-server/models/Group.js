const mongoose = require('mongoose');
const GroupSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  members: { type: [String], default: [] }
});
module.exports = mongoose.model('Group', GroupSchema);
