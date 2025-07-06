import mongoose from "mongoose";
import Message from "./models/Message.js";

await mongoose.connect("mongodb://127.0.0.1:27017/real-time-collab", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

await Message.deleteMany({});
console.log("🧹 All messages deleted from DB");

await mongoose.disconnect();
