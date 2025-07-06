import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiEdit2,
  FiTrash2,
  FiFile,
  FiMessageSquare,
  FiArrowLeft,
} from "react-icons/fi";
import "./../styles/ProjectDetails.css";

const ProjectDetails = () => {
  const { id } = useParams();
  localStorage.setItem("projectId", id);
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    inviteEmails: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/projects/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProject(res.data);
        setForm({
          title: res.data.title,
          description: res.data.description,
          inviteEmails: "",
        });
      } catch (err) {
        console.error("Error fetching project:", err);
      }
    };
    fetchProject();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);

      if (form.inviteEmails) {
        const emails = form.inviteEmails
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email);
        formData.append("inviteEmails", JSON.stringify(emails));
      }

      if (file) formData.append("file", file);

      const res = await axios.put(
        `http://localhost:5000/api/projects/${id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Project updated!");
      setProject(res.data);
      setEditMode(false);
    } catch (err) {
      console.error("Error updating project:", err);
      alert("Update failed.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Project deleted!");
      navigate("/");
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Delete failed.");
    }
  };

  if (!project)
    return (
      <div className="project-details-bg">
        <div className="project-details-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );

  return (
    <div className="project-details-bg">
      <motion.div
        className="project-details-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      >
        <button onClick={() => navigate(-1)} className="back-btn">
          <FiArrowLeft /> Back to Projects
        </button>

        {editMode ? (
          <div className="edit-form">
            <h2 className="section-title">Edit Project</h2>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Project Title"
              className="styled-input"
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Project Description"
              className="styled-textarea"
            />
            <input
              type="text"
              name="inviteEmails"
              value={form.inviteEmails}
              onChange={handleChange}
              placeholder="Invite members (comma-separated emails)"
              className="styled-input"
            />
            <div className="file-upload">
              <label htmlFor="file-upload" className="file-upload-label">
                <FiFile /> {file ? file.name : "Choose File"}
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="file-input"
              />
            </div>
            <div className="btn-group">
              <motion.button
                onClick={handleUpdate}
                className="btn purple"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEdit2 /> Save Changes
              </motion.button>
              <motion.button
                onClick={() => setEditMode(false)}
                className="btn gray"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            <div className="project-header">
              <h1 className="project-title">{project.title}</h1>
              <div className="project-meta">
                <span>
                  Created At: {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="project-section">
              <h3 className="section-title">Description</h3>
              <p className="project-desc">{project.description}</p>
            </div>

            {project.file && (
              <div className="project-section">
                <h3 className="section-title">Attachments</h3>
                <div className="project-media">
                  {project.file.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                    <motion.div
                      className="media-container"
                      whileHover={{ scale: 1.02 }}
                    >
                      <img
                        src={`http://localhost:5000${project.file}`}
                        alt="Project attachment"
                        className="project-image"
                      />
                    </motion.div>
                  ) : (
                    <a
                      href={`http://localhost:5000${project.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      <FiFile /> Download Attachment
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="btn-group">
              <motion.button
                onClick={() => setEditMode(true)}
                className="btn yellow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEdit2 /> Edit Project
              </motion.button>
              <motion.button
                onClick={() =>
                  navigate(`/realtime?me=${localStorage.getItem("userId")}`)
                }
                className="btn blue"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiMessageSquare /> Tasks & Chat
              </motion.button>
              <motion.button
                onClick={handleDelete}
                className="btn red"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiTrash2 /> Delete Project
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ProjectDetails;
