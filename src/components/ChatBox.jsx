import React, { useEffect, useState } from "react";
import socket from "../socket";
import "../styles/chat.css";

const ChatBox = ({ currentUserId }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const ROOM_ID = "global-chat-room"; // fixed group room

  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("addUser", currentUserId);
    socket.emit("join-room", ROOM_ID);

    // Load past messages for the group room
    fetch(`http://localhost:5000/api/chatrooms/${ROOM_ID}/messages`)
      .then((res) => res.json())
      .then((data) => setMessages(data));

    // Listen for incoming messages
    const handleReceive = ({ senderId, text }) => {
      setMessages((prev) => [...prev, { senderId, text }]);
    };

    socket.on("receive-message", handleReceive);

    return () => {
      socket.off("receive-message", handleReceive);
    };
  }, [currentUserId]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const newMsg = {
      roomId: ROOM_ID,
      senderId: currentUserId,
      text: trimmed,
    };

    socket.emit("send-message", newMsg);
    setMessages((prev) => [...prev, { senderId: currentUserId, text: trimmed }]);
    setMessage("");
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${
              msg.senderId === currentUserId ? "sent" : "received"
            }`}
          >
            <strong>{msg.senderId}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;