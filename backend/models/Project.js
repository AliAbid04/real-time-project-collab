import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  file: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Project", projectSchema);
