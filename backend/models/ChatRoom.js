import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  _id: String, // Using projectId as _id
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export default ChatRoom;