import React, { useEffect, useState } from "react";

const NotificationPanel = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    console.log("📩 Fetching notifications for user:", userId);

    fetch(`http://localhost:5000/api/notifications/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📬 Received notifications:", data);
        setNotifications(data);
      })
      .catch((err) => {
        console.error("❌ Error loading notifications:", err);
      });
  }, [userId]);

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
