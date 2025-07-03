import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  assignedTo: String, // userId
  createdBy: String,
  status: {
    type: String,
    default: "todo" // todo | in-progress | done
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
