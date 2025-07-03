// utils/socket.js

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("🔌 A user connected: " + socket.id);

    // Join project room
    socket.on("join_project", (projectId) => {
      socket.join(projectId);
      console.log(`User ${socket.id} joined project ${projectId}`);
    });

    // Handle new chat message
    socket.on("send_message", ({ projectId, message }) => {
      socket.to(projectId).emit("receive_message", message);
    });

    // Handle task updates
    socket.on("task_updated", (task) => {
      socket.to(task.projectId).emit("task_updated", task);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected: " + socket.id);
    });
  });
};
