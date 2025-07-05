import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  _id: {
    type: String, // 👈 this is the key fix
    required: true,
  },
  messages: [
    {
      sender: String,
      text: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

export default ChatRoom;
