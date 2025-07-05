import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./../styles/ProjectDetails.css";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [file, setFile] = useState(null); // ✅ moved inside the component

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
        console.log("Loaded project:", res.data);

        setForm({ title: res.data.title, description: res.data.description });
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
      if (file) {
        formData.append("file", file);
      }

      const res = await axios.put(
        `http://localhost:5000/api/projects/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Project updated!");
      setProject(res.data);
      setEditMode(false);
    } catch (err) {
      console.error("Error updating project:", err);
      alert("Update failed. Ask project owner to update it.");
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
      alert("Delete failed. Ask project owner to delete it.");
    }
  };

  if (!project)
    return <div className="project-details-container">Loading...</div>;

  return (
    <div className="project-details-container">
      {editMode ? (
        <div>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="border p-2 w-full mb-4"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="border p-2 w-full mb-4"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-2 w-full mb-4"
          />

          <button
            onClick={handleUpdate}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Save
          </button>
          <button
            onClick={() => setEditMode(false)}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-2">{project.title}</h2>
          <p className="mb-4">{project.description}</p>

          {/* ✅ Show Uploaded File if present */}
          {project.file && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Attached File:</h4>
              {project.file.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                <img
                  src={`http://localhost:5000${project.file}`}
                  alt="Uploaded"
                  className="max-w-full h-auto rounded shadow"
                />
              ) : (
                <a
                  href={`http://localhost:5000${project.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View File
                </a>
              )}
            </div>
          )}

          <button
            onClick={() => setEditMode(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
          >
            Edit
          </button>

          <button
            onClick={() =>
              navigate(`/realtime?me=${localStorage.getItem("userId")}`)
            }
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Chat, Kanban, and Tasks
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
