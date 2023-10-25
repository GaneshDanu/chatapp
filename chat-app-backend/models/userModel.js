const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true},
  phone: { type: String, required: true, unique: true },
  password: {type: String, required: true},
  createdDate: {type: Date, default: Date.now},
  // role: {type: String, default: 'user', enum: ['user', 'admin']}
});

const User = mongoose.model('Users', userSchema);

module.exports = User;
