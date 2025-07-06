import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./../styles/Homepage.css";

const Homepage = () => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);

  useEffect(() => {
  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUser(data);

  };

  fetchUser();
}, []);


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
        <h1>All Projects</h1>

        {/* 🔍 Search Input with Icon */}
<div className="search-wrapper">
  <span className="search-icon">🔍</span>
  <input
    type="text"
    placeholder="Search projects..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>


        <div className="project-list">
          {filteredProjects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            filteredProjects.map((project) => (
              <Link to={`/projects/${project._id}`} className="project-card" key={project._id}>
                <h3>{project.title}</h3>
                <p>{project.description.slice(0, 100)}...</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
