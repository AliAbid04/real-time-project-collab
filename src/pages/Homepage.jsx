import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./../styles/Homepage.css";

const Homepage = () => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);
        setFilteredProjects(res.data);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };

    fetchProjects();
  }, []);

  // 🔍 Filter projects when searchTerm changes
  useEffect(() => {
    const filtered = projects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  return (
    <div className="homepage">
      <div className="homepage-content">
        <h1 className="text-3xl font-bold mb-4">All Projects</h1>

        {/* 🔍 Search Input */}
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 w-full mb-4 rounded"
        />

        <div className="project-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProjects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            filteredProjects.map((project) => (
              <Link
                to={`/projects/${project._id}`}
                className="border p-4 rounded shadow hover:shadow-lg transition"
                key={project._id}
              >
                <h3 className="font-semibold text-lg">{project.title}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  {project.description.slice(0, 100)}...
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
