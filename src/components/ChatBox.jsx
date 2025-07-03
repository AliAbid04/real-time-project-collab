import React, { useEffect, useState } from "react";
import socket from "../socket"; // ✅ use shared socket
import "../styles/chat.css";

const ChatBox = ({ currentUserId, targetUserId }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit("addUser", currentUserId);

    fetch(`http://localhost:5000/api/messages?user1=${currentUserId}&user2=${targetUserId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data));

    socket.on("receiveMessage", ({ senderId, text }) => {
      setMessages((prev) => [...prev, { senderId, text }]);
    });

    return () => {
      socket.off("receiveMessage"); // ✅ avoid multiple bindings
    };
  }, [currentUserId, targetUserId]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const newMsg = {
      senderId: currentUserId,
      receiverId: targetUserId,
      text: trimmed,
    };

    socket.emit("sendMessage", newMsg);
    setMessages((prev) => [...prev, { senderId: currentUserId, text: trimmed }]);
    setMessage("");
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.senderId === currentUserId ? "sent" : "received"}`}>
            {msg.text}
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
