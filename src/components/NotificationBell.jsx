import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";

// Connect socket
const socket = io("http://localhost:5000", {
  transports: ["polling", "websocket"]
});
window.socket = socket; // for testing in console

const NotificationBell = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Fetch existing notifications from DB
    fetch(`http://localhost:5000/api/notifications/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        console.log("Fetched notifications:", data); // ✅ debug
      })
      .catch((err) => console.error("Error fetching notifications:", err));

    socket.emit("addUser", userId);

    socket.on("notify", ({ message }) => {
      toast.info(message);
      setNotifications((prev) => [
        { message, timestamp: new Date() },
        ...prev
      ]);
    });

    return () => {
      socket.off("notify");
    };
  }, [userId]);

  return (
    <div style={{ position: "relative", margin: "10px" }}>
      <button onClick={() => setShowDropdown(!showDropdown)}>
        🔔 {notifications.length}
      </button>
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "0",
            background: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
            width: "250px",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map((n, i) => (
              <div key={i} style={{ borderBottom: "1px solid #ddd", padding: "5px 0" }}>
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
