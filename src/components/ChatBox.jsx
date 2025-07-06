import React, { useEffect, useState, useRef } from "react";
import { Send, Users, MessageCircle } from "lucide-react";
import io from "socket.io-client";
import axios from "axios";
import "../styles/chat.css";

const ChatBox = ({ projectId, userid }) => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize socket - runs only once when component mounts
  useEffect(() => {
    if (!projectId || !userid) return;

    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
      autoConnect: false // We'll manually connect
    });

    setSocket(newSocket);
    newSocket.connect();

    return () => {
      if (newSocket.connected) {
        newSocket.emit("leave-project", { projectId, userId: userid });
      }
      newSocket.disconnect();
    };
  }, [projectId, userid]);

  // Socket event listeners - separate effect
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join-project", { projectId, userId: userid });
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleMessage = (msg) => {
      // Prevent duplicates by checking if message already exists
      setMessages(prev => {
        const exists = prev.some(m => 
          m._id === msg._id || 
          (m.text === msg.text && m.senderId === msg.senderId && m.timestamp === msg.timestamp)
        );
        return exists ? prev : [...prev, msg];
      });
    };

    const handleOnlineUsers = (users) => setOnlineUsers(users);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("message-received", handleMessage);
    socket.on("online-users", handleOnlineUsers);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("message-received", handleMessage);
      socket.off("online-users", handleOnlineUsers);
    };
  }, [socket, projectId, userid]);

  // Load previous messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/${projectId}/messages`);
        setMessages(res.data || []);
      } catch (err) {
        console.error("Error loading chat:", err);
        setError("Failed to load messages");
      }
    };
    if (projectId) fetchMessages();
  }, [projectId]);

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !socket || !isConnected) return;

    const msg = {
      projectId,
      senderId: userid,
      text: trimmed,
      timestamp: new Date(),
    };

    socket.emit("send-message", msg);
    setMessage("");
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    return diffHours < 24
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <MessageCircle size={20} />
          <h3>Project Chat</h3>
          <div
            className={`connection-status ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            <div className="status-dot" />
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
        <div className="chat-header-right">
          <Users size={16} />
          <span>{onlineUsers.length}</span>
        </div>
      </div>

      {error && (
        <div className="chat-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <MessageCircle size={48} />
            <p>No messages yet</p>
            <span>Start the conversation!</span>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`message ${
                msg.senderId === userid ? "message-sent" : "message-received"
              }`}
            >
              {msg.senderId !== userid && (
                <div className="message-sender">{msg.senderId}</div>
              )}
              <div className="message-content">
                <div className="message-text">{msg.text}</div>
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input-form">
        <div className="chat-input-container">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            className="chat-input"
            disabled={!isConnected}
            maxLength={500}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!message.trim() || !isConnected}
          >
            <Send size={18} />
          </button>
        </div>
        <div className="input-footer">
          <span className="char-count">{message.length}/500</span>
          <span className="input-hint">Press Enter to send</span>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
