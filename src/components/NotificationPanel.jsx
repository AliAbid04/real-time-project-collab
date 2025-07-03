import React, { useEffect, useState } from "react";

const NotificationPanel = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);

 useEffect(() => {
  console.log("📩 Fetching notifications for user:", userId);

  fetch(`http://localhost:5000/api/notifications/${userId}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("📬 Received notifications:", data); // ✅ ADD
      setNotifications(data);

      if (data.length > 0) {
        // ✅ ONLY mark as read if data received
        fetch(`http://localhost:5000/api/notifications/mark-read/${userId}`, {
          method: "POST",
        });
      }
    })
    .catch((err) => {
      console.error("❌ Error loading notifications:", err);
    });
}, [userId]);


  // ✅ Move logs here
  console.log("📩 userId in NotificationPanel:", userId);
  console.log("🔔 Notifications:", notifications);

  return (
    <div style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
      <h3>🔔 Notifications</h3>
      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        notifications.map((n, idx) => (
          <div key={idx} style={{ marginBottom: 5 }}>
            {n.message}
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationPanel;
