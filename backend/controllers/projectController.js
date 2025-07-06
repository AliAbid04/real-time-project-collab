import User from "../models/User.js";
import Project from "../models/Project.js";

// CREATE PROJECT
export const createProject = async (req, res) => {
  const { title, description, inviteEmails } = req.body;
  const creatorId = req.user?.id;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  if (!title) return res.status(400).json({ message: "Title is required" });

  try {
    const inviteList = typeof inviteEmails === 'string' ? JSON.parse(inviteEmails) : inviteEmails || [];
    const invitedUsers = await User.find({ email: { $in: inviteList } });
    const invitedUserIds = invitedUsers.map(u => u._id);
    const members = [creatorId, ...invitedUserIds];

    const newProject = await Project.create({
      title,
      description,
      createdBy: creatorId,
      members,
      file: fileUrl,
    });

    res.status(201).json(newProject);
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ message: "Server error while creating project" });
  }
};

// GET PROJECTS
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user.id });
    res.json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET PROJECT BY ID
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("members", "email name")
      .populate("createdBy", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    console.error("Error fetching project:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE PROJECT
export const deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this project" });
    }

    await project.deleteOne();
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Server error while deleting project" });
  }
};

// UPDATE PROJECT (add new members via inviteEmails)
export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { title, description, inviteEmails } = req.body;

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to edit this project" });
    }

    // Update title/description
    if (title) project.title = title;
    if (description) project.description = description;

    // Add new members
    if (inviteEmails) {
      const inviteList = typeof inviteEmails === "string"
        ? JSON.parse(inviteEmails)
        : inviteEmails;

      const invitedUsers = await User.find({ email: { $in: inviteList } });
      const invitedUserIds = invitedUsers.map(u => u._id.toString());

      invitedUserIds.forEach(uid => {
        if (!project.members.map(id => id.toString()).includes(uid)) {
          project.members.push(uid);
        }
      });
    }

    // Upload file
    if (req.file) {
      project.file = `/uploads/${req.file.filename}`;
    }

    const updatedProject = await project.save();
    res.status(200).json(updatedProject);
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ message: "Server error while updating project" });
  }
};
