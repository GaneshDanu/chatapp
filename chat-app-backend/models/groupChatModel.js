const mongoose = require('mongoose');

const groupChatScheema = new mongoose.Schema({
  name: { type: String, required: true, unique: true},
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users',
    required: true
  },
  createdDate: {type: Date, default: Date.now},
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Users',
      required: true,
    },
    createdDate: {type: Date, default: Date.now},
    // role: {type: String, default: 'user', enum: ['user', 'admin']},
  }],
  chats: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Users',
    },
    message: {type: String, default: ''},
    createdDate: {type: Date, default: Date.now},
  }]
});

const GroupChat = mongoose.model('groupChat', groupChatScheema);

module.exports = GroupChat;
