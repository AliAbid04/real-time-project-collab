import React, { useEffect, useState } from "react";
import socket from "./socket";
import ChatBox from "./components/ChatBox";
import NotificationPanel from "./components/NotificationPanel";
import KanbanBoard from "./components/KanbanBoard";

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = urlParams.get("me");
  const targetUserId = urlParams.get("to");

  const [newNotifications, setNewNotifications] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("addUser", currentUserId);

    socket.on("notify", () => {
      setNewNotifications((prev) => prev + 1);
    });

    socket.on("task-updated", ({ by }) => {
      if (by !== currentUserId) {
        setNewNotifications((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("notify");
      socket.off("task-updated");
    };
  }, [currentUserId]);

  const handleOpenNotifications = () => {
  setShowPanel(!showPanel);

  // Delay resetting count to AFTER panel shows
  setTimeout(() => {
    setNewNotifications(0);

    fetch(`http://localhost:5000/api/notifications/mark-read/${currentUserId}`, {
      method: "POST",
    });
  }, 100); // small delay ensures notifications are fetched first
};

  console.log("🔍 currentUserId in App.jsx:", currentUserId);

  if (!currentUserId || !targetUserId) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Missing user IDs in URL</h2>
        <p>
          Use: <code>?me=user1&to=user2</code>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>💬 Team Chat</h1>

      <button onClick={handleOpenNotifications}>
        🔔 Notifications ({newNotifications})
      </button>

      {showPanel && <NotificationPanel userId={currentUserId} />}

      <ChatBox currentUserId={currentUserId} targetUserId={targetUserId} />

      {/* Kanban Board with Notification Integration */}
      <KanbanBoard currentUserId={currentUserId} targetUserId={targetUserId} />
      

    </div>
  );
}

export default App;
