// src/components/KanbanBoard.jsx
import React, { useEffect, useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import socket from "../socket";
import "../styles/KanbanBoard.css";
import ProgressChart from "./ProgressChart";

const columnTitles = {
  todo: "To Do",
  inProgress: "In Progress",
  done: "Done",
};

const currentUserId = localStorage.getItem("userId");


const KanbanBoard = () => {
  const [columns, setColumns] = useState({
    todo: [],
    inProgress: [],
    done: [],
  });
  

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const chartRef = useRef(null);

  const fetchTasks = async () => {
    const res = await fetch("http://localhost:5000/api/kanban-tasks");
    const tasks = await res.json();

    const grouped = { todo: [], inProgress: [], done: [] };
    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    setColumns(grouped);
  };

  useEffect(() => {
    fetchTasks();
    socket.on("kanban-update-db", (allTasks) => {
      const grouped = { todo: [], inProgress: [], done: [] };
      allTasks.forEach((task) => {
        grouped[task.status].push(task);
      });
      setColumns(grouped);
    });

    return () => {
      socket.off("kanban-update-db");
    };
  }, []);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    await fetch("http://localhost:5000/api/kanban-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle }),
    });

    setNewTaskTitle("");
    fetchTasks();
    window.dispatchEvent(new Event("task-status-updated"));
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceTasks = [...columns[source.droppableId]];
    const destTasks = [...columns[destination.droppableId]];
    const [moved] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceTasks.splice(destination.index, 0, moved);
    } else {
      destTasks.splice(destination.index, 0, moved);
    }

    const newBoard = {
      ...columns,
      [source.droppableId]: sourceTasks,
      [destination.droppableId]: destTasks,
    };

    setColumns(newBoard);

    await fetch(`http://localhost:5000/api/kanban-tasks/${moved._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: destination.droppableId }),
    });

    socket.emit("task-dragged");
    socket.emit("sendNotification", {
      userId: "all",
      message: "🔔 A task was moved on the board",
    });

    window.dispatchEvent(new Event("task-status-updated"));
  };

  const handleRefreshChart = () => {
    chartRef.current?.refreshChart();
  };

  return (
    <div className="kanban-container">
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Enter task title"
          style={{ padding: "8px", marginRight: "5px", width: "288px", marginLeft: "30px" ,marginBottom : "-20px"}}
        />
        <div className="kanban-controls">
  <button onClick={handleAddTask}>➕ Add Task</button>
  <button onClick={handleRefreshChart}>🔄 Refresh Chart</button>
</div>

        <ProgressChart ref={chartRef} />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {Object.entries(columns).map(([columnId, tasks]) => (
          <Droppable droppableId={columnId} key={columnId}>
            {(provided) => (
              <div
                className="kanban-column"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2>{columnTitles[columnId]}</h2>
                {tasks.map((task, index) => (
  <Draggable draggableId={task._id} index={index} key={task._id}>
  {(provided, snapshot) => (
    <div
      className={`kanban-task ${snapshot.isDragging ? "dragging" : ""}`}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      {task.title}
    </div>
  )}
</Draggable>
))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
