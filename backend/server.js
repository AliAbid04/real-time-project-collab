import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch";

// Routes from Project 1
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

// Models from Project 2
import Message from "./models/Message.js";
import Notification from "./models/Notification.js";
import Task from "./models/Task.js";
import KanbanTask from "./models/KanbanTask.js";
import ChatRoom from "./models/ChatRoom.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// Project 1 Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

// 🧠 Online Users (existing functionality)
const onlineUsers = {};

// 📱 Chat System - Store online users per project
const projectOnlineUsers = new Map(); // projectId -> Map of users

// Chat Message Schema for MongoDB (if not already defined)
const chatMessageSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 500,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", chatMessageSchema);

// 🔌 Socket.io Setup
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ===== EXISTING FUNCTIONALITY =====

  // Join room for project chat (existing)
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`👥 User ${socket.id} joined room ${roomId}`);
  });

  // // Send and store chat message (existing)
  // socket.on("send-message", async ({ roomId, senderId, text }) => {
  //   const message = {
  //     sender: senderId,
  //     text,
  //     timestamp: new Date(),
  //   };

  //   io.to(roomId).emit("receive-message", message);

  //   try {
  //     await ChatRoom.findByIdAndUpdate(roomId, {
  //       $push: { messages: message },
  //     });
  //   } catch (err) {
  //     console.error("❌ Error saving message:", err);
  //   }
  // });

  socket.on('send-message', async (messageData) => {
  try {
    const { projectId, senderId, text, timestamp } = messageData;

    if (!text || text.trim().length === 0) {
      return socket.emit('error', { message: 'Message cannot be empty' });
    }

    if (text.length > 500) {
      return socket.emit('error', { message: 'Message too long' });
    }

    const newMessage = new ChatMessage({
      projectId,
      senderId,
      text: text.trim(),
      timestamp: timestamp || new Date()
    });

    const savedMessage = await newMessage.save();

    io.to(projectId).emit('message-received', {
      _id: savedMessage._id,
      projectId: savedMessage.projectId,
      senderId: savedMessage.senderId,
      text: savedMessage.text,
      timestamp: savedMessage.timestamp
    });

    console.log(`Message sent in project ${projectId} by ${senderId}`);
  } catch (error) {
    console.error('Error sending message:', error);
    socket.emit('error', { message: 'Failed to send message' });
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

  // socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
  //   const receiverSocketId = onlineUsers[receiverId];
  //   if (receiverSocketId)
  //     io.to(receiverSocketId).emit("receiveMessage", { senderId, text });
  //   await Message.create({ senderId, receiverId, text });
  // });

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

  // ===== NEW ENHANCED CHAT FUNCTIONALITY =====

  // Join project chat room with enhanced features
  socket.on("join-project", async (data) => {
    const { projectId, userId, userName } = data;

    try {
      // Join the room
      socket.join(projectId);

      // Store user info
      socket.userId = userId;
      socket.userName = userName;
      socket.projectId = projectId;

      // Add to online users for this project
      if (!projectOnlineUsers.has(projectId)) {
        projectOnlineUsers.set(projectId, new Map());
      }
      projectOnlineUsers
        .get(projectId)
        .set(userId, { userId, userName, socketId: socket.id });

      // Notify others in the room
      socket.to(projectId).emit("user-joined", { userId, userName });

      // Send updated online users list
      const projectUsers = Array.from(
        projectOnlineUsers.get(projectId).values()
      );
      io.to(projectId).emit("online-users", projectUsers);

      console.log(`User ${userName} joined project ${projectId}`);
    } catch (error) {
      console.error("Error joining project:", error);
      socket.emit("error", { message: "Failed to join project" });
    }
  });

  // Handle enhanced message sending
  // socket.on("send-message", async (messageData) => {
  //   try {
  //     const { projectId, senderId, text, timestamp } = messageData;

  //     // Validate message
  //     if (!text || text.trim().length === 0) {
  //       return socket.emit("error", { message: "Message cannot be empty" });
  //     }

  //     if (text.length > 500) {
  //       return socket.emit("error", { message: "Message too long" });
  //     }

  //     // Save message to database
  //     const newMessage = new ChatMessage({
  //       projectId,
  //       senderId,
  //       text: text.trim(),
  //       timestamp: timestamp || new Date(),
  //     });

  //     const savedMessage = await newMessage.save();

  //     // Broadcast to all users in the project room
  //     io.to(projectId).emit("message-received", {
  //       _id: savedMessage._id,
  //       projectId: savedMessage.projectId,
  //       senderId: savedMessage.senderId,
  //       senderName: savedMessage.senderName,
  //       text: savedMessage.text,
  //       timestamp: savedMessage.timestamp,
  //       isSystem: savedMessage.isSystem,
  //     });

  //     console.log(`Message sent in project ${projectId} by ${senderName}`);
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //     socket.emit("error", { message: "Failed to send message" });
  //   }
  // });

  // Handle leaving project
  socket.on("leave-project", (data) => {
    const { projectId, userId } = data;
    handleUserLeave(socket, projectId, userId);
  });

  // Handle disconnect (existing + enhanced)
  socket.on("disconnect", () => {
    // Existing cleanup
    for (const id in onlineUsers) {
      if (onlineUsers[id] === socket.id) delete onlineUsers[id];
    }

    // Enhanced cleanup for project chat
    if (socket.projectId && socket.userId) {
      handleUserLeave(socket, socket.projectId, socket.userId);
    }

    console.log("❌ User disconnected:", socket.id);
  });
});

// Helper function to handle user leaving project chat
function handleUserLeave(socket, projectId, userId) {
  try {
    // Remove from online users
    if (projectOnlineUsers.has(projectId)) {
      const projectUsers = projectOnlineUsers.get(projectId);
      const userData = projectUsers.get(userId);
      projectUsers.delete(userId);

      // If no users left in project, remove the project
      if (projectUsers.size === 0) {
        projectOnlineUsers.delete(projectId);
      }

      // Notify others in the room
      if (userData) {
        socket.to(projectId).emit("user-left", {
          userId,
          userName: userData.userName,
        });

        // Send updated online users list
        const remainingUsers = Array.from(projectUsers.values());
        socket.to(projectId).emit("online-users", remainingUsers);
      }
    }

    // Leave the room
    socket.leave(projectId);
    console.log(`User ${socket.userName} left project ${projectId}`);
  } catch (error) {
    console.error("Error handling user leave:", error);
  }
}

// ===== EXISTING API ROUTES =====

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
    const task = await KanbanTask.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    const allTasks = await KanbanTask.find();
    io.emit("kanban-update-db", allTasks);
    io.emit("chart-update");
    res.json(task);
  } catch {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ✅ Messaging & Notifications (existing)
app.get("/api/messages", async (req, res) => {
  const { user1, user2 } = req.query;
  try {
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
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
      read: false,
    }).sort({ timestamp: -1 });
    res.json(notifications);
  } catch {
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

app.post("/api/notifications/mark-read/:userId", async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { $set: { read: true } }
    );
    res.send("🔕 Notifications marked as read");
  } catch {
    res.status(500).send("❌ Failed to update notifications");
  }
});

app.post("/api/assign-task", async (req, res) => {
  const { title, description, assignedTo, createdBy } = req.body;
  try {
    const task = await Task.create({
      title,
      description,
      assignedTo,
      createdBy,
    });
    const socketId = onlineUsers[assignedTo];
    const message = `📌 New task assigned: "${title}"`;
    if (socketId) io.to(socketId).emit("notify", { message });
    await Notification.create({ userId: assignedTo, message, read: false });
    res.status(201).json({ success: true, task });
  } catch {
    res.status(500).json({ success: false, error: "Task assignment failed" });
  }
});

// ===== NEW ENHANCED CHAT API ROUTES =====

app.get('/api/chat/:projectId/messages', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await ChatMessage.find({ projectId })
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('projectId senderId text timestamp')
      .exec();

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});


// Get online users for a project
app.get("/api/chat/:projectId/online-users", (req, res) => {
  try {
    const { projectId } = req.params;
    const projectUsers = projectOnlineUsers.get(projectId);

    if (projectUsers) {
      const users = Array.from(projectUsers.values());
      res.json(users);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching online users:", error);
    res.status(500).json({ error: "Failed to fetch online users" });
  }
});

// Delete a message (optional - for moderation)
app.delete("/api/chat/messages/:messageId", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body; // Should be the sender or admin

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user can delete (sender or admin logic here)
    if (message.senderId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this message" });
    }

    await ChatMessage.findByIdAndDelete(messageId);

    // Notify all users in the project room
    io.to(message.projectId).emit("message-deleted", { messageId });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// ✅ Debug & Group Chat Routes (existing)
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
    const unread = await Notification.find({
      userId: req.params.userId,
      read: false,
    });
    res.json(unread);
  } catch {
    res.status(500).json({ error: "Failed to fetch unread notifications" });
  }
});

app.get("/api/chatrooms/:roomId/messages", async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId).populate(
      "messages.sender",
      "name"
    );
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room.messages);
  } catch {
    res.status(500).json({ error: "Failed to fetch group messages" });
  }
});

// 🚨 Global Chat Room (auto-create) (existing)
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    onlineUsers: Object.keys(onlineUsers).length,
    projectChats: projectOnlineUsers.size,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// MongoDB Connect
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/real-time-collab",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  fetch(`http://localhost:${PORT}/api/create-global-room`)
    .then((res) => res.text())
    .then(console.log)
    .catch(console.error);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    mongoose.connection.close();
  });
});
