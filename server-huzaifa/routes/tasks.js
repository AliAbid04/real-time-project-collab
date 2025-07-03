const express = require("express");
const Task = require("../models/Task");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

// create task 
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { title, description, project, assignedTo } = req.body;

    // project existance checki
    const foundProject = await Project.findById(project);
    if (!foundProject) {
      return res.status(404).json({ msg: "Project not found" });
    }

    // only creator can edit 
    if (foundProject.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not allowed to add tasks to this project" });
    }

    const newTask = new Task({
      title,
      description,
      project,
      assignedTo,
      createdBy: req.user.id,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to create task" });
  }
});

// getting the tasks for a project
router.get("/:projectId", authMiddleware, async (req, res) => { // in the frontend make a element that 
    // passes the project id to this api call 
  try {
    const tasks = await Task.find({
      project: req.params.projectId,
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch tasks" });
  }
});

// editing task based on user only allow editing the details if the user is the author of the project
router.put("/:id", authMiddleware, async (req, res) => { // this is the task id 
  try {
    const { title, description, status, assignedTo } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ msg: "Task not found" });

    const userId = req.user.id;

    if (task.createdBy.toString() === userId) {
      // Full access if user is creator
      task.title = title || task.title;
      task.description = description || task.description;
      task.status = status || task.status;
      task.assignedTo = assignedTo || task.assignedTo;
    } else if (task.assignedTo?.toString() === userId) {
      // Only status update if assigned user
      if (status) {
        task.status = status;
      } else {
        return res.status(403).json({ msg: "You can only update the task status" });
      }
    } else {
      return res.status(403).json({ msg: "Not authorized to update this task" });
    }

    await task.save();
    res.json({ msg: "Task updated", task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Something went wrong" });
  }
});



// this is not for use rn ill update this later
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (
      task.createdBy.toString() !== req.user.id &&
      task.assignedTo?.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: "Not authorized to update status" });
    }

    task.status = status;
    await task.save();
    res.json({ msg: "Status updated", task });
  } catch (err) {
    res.status(500).json({ msg: "Failed to update status" });
  }
});


// delete task only the creator can do this
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only creator can delete the task" });
    }

    await task.deleteOne();
    res.json({ msg: "Task deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete task" });
  }
});

module.exports = router;
