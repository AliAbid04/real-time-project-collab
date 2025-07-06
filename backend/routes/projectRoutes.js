import express from "express";
import { 
  createProject, getProjects, getProjectById, updateProject, deleteProject 
} from "../controllers/projectController.js";
import { upload } from "../middlewares/upload.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getProjects);
router.get("/:id", authMiddleware, getProjectById);
router.post("/", authMiddleware, upload.single("file"), createProject); // only this POST
router.put("/:id", authMiddleware, upload.single("file"), updateProject); // only this PUT
router.delete("/:id", authMiddleware, deleteProject);

export default router;
