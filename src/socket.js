// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],    // ✅ Use only WebSocket
  withCredentials: true,        // ✅ Allow credentials (for CORS with cookies if needed)
  reconnection: true,           // ✅ Enable reconnection
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
