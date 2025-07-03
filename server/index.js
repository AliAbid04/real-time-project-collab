import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import Message from "./models/Message.js";
import Notification from "./models/Notification.js";
import Task from "./models/Task.js";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🔗 Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/real-time-collab", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB connection failed:", err);
});

// 🧠 Store connected users
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("addUser", (userId) => {
    onlineUsers[userId] = socket.id;
    socket.userId = userId;
    console.log("User added:", userId);
  });

  socket.on("sendNotification", async ({ userId, message }) => {
    const receiverSocketId = onlineUsers[userId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("notify", { message });
    }
    await Notification.create({ userId: to, message, read: false });

  });

  socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", { senderId, text });
    }
    await Message.create({ senderId, receiverId, text });
  });

 socket.on("task-updated", async ({ by, to, taskTitle, updatedColumns }) => {
  console.log("📩 task-updated received:", { by, to, taskTitle });

  const message = `📝 "${taskTitle}" was moved by ${by}`;
  const receiverSocket = onlineUsers[to];

  if (receiverSocket) {
    console.log("✅ Emitting to:", to);
    io.to(receiverSocket).emit("notify", { message });
    io.to(receiverSocket).emit("kanban-update", { updatedColumns });
  }

  try {
    console.log("📤 Saving notification for:", to, message); // ✅ ADD THIS LINE
    await Notification.create({ userId: to, message, read: false });

  } catch (err) {
    console.error("❌ Error saving notification:", err);
  }
});


  socket.on("disconnect", () => {
    for (const id in onlineUsers) {
      if (onlineUsers[id] === socket.id) {
        delete onlineUsers[id];
      }
    }
    console.log("User disconnected:", socket.id);
  });
});


// 📦 Load chat history API
app.get("/api/messages", async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// 📩 Get unread notifications
app.get("/api/notifications/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await Notification.find({ userId, read: false }).sort({ timestamp: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

// ✅ Mark notifications as read
app.post("/api/notifications/mark-read/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.send("🔕 Notifications marked as read");
  } catch (err) {
    res.status(500).send("❌ Failed to update notifications");
  }
});

// ✅ Assign a task and notify user
app.post("/api/assign-task", async (req, res) => {
  const { title, description, assignedTo, createdBy } = req.body;

  try {
    const task = await Task.create({ title, description, assignedTo, createdBy });
    const socketId = onlineUsers[assignedTo];
    const message = `📌 New task assigned: "${title}"`;

    if (socketId) {
      io.to(socketId).emit("notify", { message });
    }

    await Notification.create({ userId: assignedTo, message, read: false });

    res.status(201).json({ success: true, task });
  } catch (err) {
    console.error("Error assigning task:", err);
    res.status(500).json({ success: false, error: "Task assignment failed" });
  }
});

server.listen(5000, () => {
  console.log("🚀 Socket.io server running on http://localhost:5000");
});
// 🚨 TEMP DEBUG ROUTE to view all notifications
app.get("/debug/notifications", async (req, res) => {
  try {
    const allNotifications = await Notification.find({});
    res.json(allNotifications);
  } catch (err) {
    console.error("❌ Failed to fetch notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ✅ To check only unread notifications of a user
app.get("/debug/unread/:userId", async (req, res) => {
  try {
    const unread = await Notification.find({ userId: req.params.userId, read: false });
    res.json(unread);
  } catch (err) {
    console.error("❌ Failed to fetch unread notifications:", err);
    res.status(500).json({ error: "Failed to fetch unread notifications" });
  }
});
