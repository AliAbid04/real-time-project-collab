const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// for the socket stuff which will handle notif etc
const http = require("http");
const { Server } = require("socket.io");

// loading the env file data
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app); // for loading socket 

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

// all the custom socket code
require("./utils/socket")(io);

const uploadRoute = require("./routes/upload");
app.use("/api/upload", uploadRoute);

// for viewing the stored images 
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//conenction to routes
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const chatRoutes = require("./routes/chat");

// go to this route when the url is visited 
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/chat", chatRoutes);


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("MongoDB connected");
  app.listen(5000, () => console.log("Server running on port 5000"));
})
.catch(err => console.log("error:", err));


