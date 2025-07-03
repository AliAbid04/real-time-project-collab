const express = require("express");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

// we will call the authmiddleware before every request so that it authenticates and 
// gets the user id so we dont have to get it manually

// creatingproject
router.post("/create", authMiddleware, async (req, res) => {
  try {
    // from the front end
    const { title, description } = req.body;
    const newProject = new Project({
      title,
      description,
      createdBy: req.user.id, // already saved in the token 
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ msg: "Failed to create project" });
  }
});

// show projects 
router.get("/getprojects", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch projects" });
  }
});

module.exports = router;

