const mongoose = require('mongoose');
const StudentSchema = new mongoose.Schema({
  id: String, // or Number, depending on your data
  first_name: String,
  last_name: String,
  group: String,
  gender: String,
  birthdate: String,
  status: String,
  username: String
});
module.exports = mongoose.model('Student', StudentSchema);
