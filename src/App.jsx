import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/Projects";
import Chat from "./pages/Chat";
import AddProject from "./pages/AddProject";
import ProjectDetails from "./pages/ProjectDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import "./theme.css";

import socket from "./socket";
import ChatBox from "./components/ChatBox";
import NotificationPanel from "./components/NotificationPanel";
import KanbanBoard from "./components/KanbanBoard";
import ProgressChart from "./components/ProgressChart";
import ReloadOnce from "./components/ReloadOnce"; // ✅ import

function App() {
  // const urlParams = new URLSearchParams(window.location.search);
  // const currentUserId = urlParams.get("me");
  const currentUserId = localStorage.getItem("userId");
  const projectId = localStorage.getItem("projectId");
  console.log("✅ currentUserId from URL:", currentUserId);
  console.log("✅ proj from URL:", projectId);

  const [newNotifications, setNewNotifications] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;

    socket.emit("addUser", currentUserId);

    socket.on("notify", () => {
      setNewNotifications((prev) => prev + 1);
    });

    return () => {
      socket.off("notify");
    };
  }, [currentUserId]);

  const handleOpenNotifications = () => {
    setShowPanel(!showPanel);

    setTimeout(() => {
      setNewNotifications(0);
      fetch(
        `http://localhost:5000/api/notifications/mark-read/${currentUserId}`,
        {
          method: "POST",
        }
      );
    }, 100);
  };

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/addproject"
          element={
            <ProtectedRoute>
              <AddProject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />

        {/* ✅ Real-Time Features Page (reloads once) */}
        <Route
          path="/realtime"
          element={(() => {
            const currentUserId = localStorage.getItem("userId");
            const projectId = localStorage.getItem("projectId");

            return currentUserId ? (
              <ReloadOnce>
                <div style={{ padding: "20px" }}>
                  <h1 style={{ textAlign: "center" }}>
                    💬 Real-Time Collaboration
                  </h1>
                  <button onClick={handleOpenNotifications}>
                    🔔 Notifications ({newNotifications})
                  </button>

                  {showPanel && <NotificationPanel userId={currentUserId} />}
                  <ChatBox
                    userid={currentUserId}
                    projectId={projectId}
                  />
                  <KanbanBoard currentUserId={currentUserId} />
                </div>
              </ReloadOnce>
            ) : (
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h2>Missing user ID in URL</h2>
                <p>
                  Use: <code>?me=user1</code>
                </p>
              </div>
            );
          })()}
        />

        {/* Catch-all: redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />

        {/* <Route
          path="/realtime/chat"
          element={
            currentUserId ? (
              <ReloadOnce>
                <div style={{ padding: "20px" }}>
                  <h1>💬 Chat</h1>
                  <ChatBox currentUserId={currentUserId} />
                </div>
              </ReloadOnce>
            ) : (
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h2>Missing user ID in URL</h2>
                <p>
                  Use: <code>?me=user1</code>
                </p>
              </div>
            )
          }
        />

        <Route
          path="/realtime/kanban"
          element={
            currentUserId ? (
              <ReloadOnce>
                <div style={{ padding: "20px" }}>
                  <h1>🗂️ Kanban Board</h1>
                  <KanbanBoard currentUserId={currentUserId} />
                </div>
              </ReloadOnce>
            ) : (
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h2>Missing user ID in URL</h2>
                <p>
                  Use: <code>?me=user1</code>
                </p>
              </div>
            )
          }
        /> */}
      </Routes>
    </>
  );
}

export default App;
