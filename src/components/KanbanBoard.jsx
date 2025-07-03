import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import socket from "../socket";
import "../styles/KanbanBoard.css";

const initialData = {
  todo: [
    { id: "1", title: "Design UI" },
    { id: "2", title: "Setup MongoDB" },
  ],
  inProgress: [
    { id: "3", title: "Implement Auth" },
  ],
  done: [
    { id: "4", title: "Project Routes" },
  ],
};

const KanbanBoard = ({ currentUserId, targetUserId }) => {
  const [columns, setColumns] = useState(initialData);

  useEffect(() => {
    socket.on("kanban-update", ({ updatedColumns }) => {
      setColumns(updatedColumns);
    });

    return () => {
      socket.off("kanban-update");
    };
  }, []);

  const onDragEnd = (result) => {
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

    socket.emit("task-updated", {
      by: currentUserId,
      to: targetUserId,
      taskTitle: moved.title,
      updatedColumns: newBoard, // Use the updated board
    });
  };

  const columnTitles = {
    todo: "To Do",
    inProgress: "In Progress",
    done: "Done",
  };

  return (
    <div className="kanban-container">
      <DragDropContext onDragEnd={onDragEnd}>
        {Object.entries(columns).map(([key, tasks]) => (
          <Droppable droppableId={key} key={key}>
            {(provided) => (
              <div
                className="kanban-column"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <h2>{columnTitles[key]}</h2>
                {tasks.map((task, index) => (
                  <Draggable draggableId={task.id} index={index} key={task.id}>
                    {(provided) => (
                      <div
                        className="kanban-task"
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
