import mongoose from "mongoose";

const kanbanTaskSchema = new mongoose.Schema({
  title: String,
  status: {
    type: String,
    enum: ["todo", "inProgress", "done"],
    default: "todo"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("KanbanTask", kanbanTaskSchema);
