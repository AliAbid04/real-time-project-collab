import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

// Routes from Project 1
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

// Models from Project 2
import Message from './models/Message.js';
import Notification from './models/Notification.js';
import Task from './models/Task.js';
import KanbanTask from './models/KanbanTask.js';
import ChatRoom from './models/ChatRoom.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// Project 1 Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// 🧠 Online Users
const onlineUsers = {};

// 🔌 Socket.io Setup
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("task-status-changed", () => io.emit("chart-update"));
  socket.on("task-dragged", () => io.emit("chart-update"));

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("send-message", async ({ roomId, senderId, text }) => {
    io.to(roomId).emit("receive-message", { senderId, text });
    try {
      await ChatRoom.findByIdAndUpdate(roomId, {
        $push: { messages: { sender: senderId, text, timestamp: new Date() } }
      });
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  socket.on("addUser", (userId) => {
    onlineUsers[userId] = socket.id;
    socket.userId = userId;
    console.log("✅ User added:", userId);
  });

  socket.on("sendNotification", async ({ userId, message }) => {
    if (userId === "all") {
      for (const uid in onlineUsers) {
        io.to(onlineUsers[uid]).emit("notify", { message });
        await Notification.create({ userId: uid, message, read: false });
      }
    } else {
      const receiverSocket = onlineUsers[userId];
      if (receiverSocket) io.to(receiverSocket).emit("notify", { message });
      await Notification.create({ userId, message, read: false });
    }
  });

  socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) io.to(receiverSocketId).emit("receiveMessage", { senderId, text });
    await Message.create({ senderId, receiverId, text });
  });

  socket.on("task-updated", async ({ by, to, taskTitle, updatedColumns }) => {
    const message = `📝 "${taskTitle}" was moved by ${by}`;
    const receiverSocket = onlineUsers[to];
    if (receiverSocket) {
      io.to(receiverSocket).emit("notify", { message });
      io.to(receiverSocket).emit("kanban-update", { updatedColumns });
    }
    io.emit("chart-update", { updatedColumns });
    await Notification.create({ userId: to, message, read: false });
  });

  socket.on("disconnect", () => {
    for (const id in onlineUsers) {
      if (onlineUsers[id] === socket.id) delete onlineUsers[id];
    }
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ Kanban Routes
app.post("/api/kanban-tasks", async (req, res) => {
  const { title } = req.body;
  try {
    const task = await KanbanTask.create({ title });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.get("/api/kanban-tasks", async (req, res) => {
  try {
    const tasks = await KanbanTask.find();
    res.json(tasks);
  } catch {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.put("/api/kanban-tasks/:id", async (req, res) => {
  const { status } = req.body;
  try {
    const task = await KanbanTask.findByIdAndUpdate(req.params.id, { status }, { new: true });
    const allTasks = await KanbanTask.find();
    io.emit("kanban-update-db", allTasks);
    io.emit("chart-update");
    res.json(task);
  } catch {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ✅ Messaging & Notifications
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
  } catch {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
      read: false
    }).sort({ timestamp: -1 });
    res.json(notifications);
  } catch {
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

app.post("/api/notifications/mark-read/:userId", async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, read: false }, { $set: { read: true } });
    res.send("🔕 Notifications marked as read");
  } catch {
    res.status(500).send("❌ Failed to update notifications");
  }
});

app.post("/api/assign-task", async (req, res) => {
  const { title, description, assignedTo, createdBy } = req.body;
  try {
    const task = await Task.create({ title, description, assignedTo, createdBy });
    const socketId = onlineUsers[assignedTo];
    const message = `📌 New task assigned: "${title}"`;
    if (socketId) io.to(socketId).emit("notify", { message });
    await Notification.create({ userId: assignedTo, message, read: false });
    res.status(201).json({ success: true, task });
  } catch {
    res.status(500).json({ success: false, error: "Task assignment failed" });
  }
});

// ✅ Debug & Group Chat Routes
app.get("/debug/notifications", async (req, res) => {
  try {
    const all = await Notification.find();
    res.json(all);
  } catch {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.get("/debug/unread/:userId", async (req, res) => {
  try {
    const unread = await Notification.find({ userId: req.params.userId, read: false });
    res.json(unread);
  } catch {
    res.status(500).json({ error: "Failed to fetch unread notifications" });
  }
});

app.get("/api/chatrooms/:roomId/messages", async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId).populate("messages.sender", "name");
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room.messages);
  } catch {
    res.status(500).json({ error: "Failed to fetch group messages" });
  }
});

// 🚨 Global Chat Room (auto-create)
app.get("/api/create-global-room", async (req, res) => {
  try {
    const exists = await ChatRoom.findById("global-chat-room");
    if (!exists) {
      await ChatRoom.create({ _id: "global-chat-room", messages: [] });
      res.send("✅ Global room created");
    } else {
      res.send("ℹ️ Room already exists");
    }
  } catch (err) {
    res.status(500).send("❌ Error creating room");
  }
});

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/real-time-collab", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  fetch(`http://localhost:${PORT}/api/create-global-room`)
    .then(res => res.text())
    .then(console.log)
    .catch(console.error);
});
