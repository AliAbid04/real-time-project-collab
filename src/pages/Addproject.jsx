import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./../styles/AddProject.css";

const AddProject = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    inviteEmails: [""], // array of email strings
  });
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmailChange = (index, value) => {
    const updatedEmails = [...form.inviteEmails];
    updatedEmails[index] = value;
    setForm({ ...form, inviteEmails: updatedEmails });
  };

  const addEmailField = () => {
    setForm({ ...form, inviteEmails: [...form.inviteEmails, ""] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("inviteEmails", JSON.stringify(form.inviteEmails));
      if (file) formData.append("file", file);

      await axios.post("http://localhost:5000/api/projects", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Project created successfully!");
      navigate("/");
    } catch (err) {
      console.error(
        "Error creating project:",
        err.response?.data || err.message
      );
      alert(
        "Error creating project: " +
          (err.response?.data?.message || "Unknown error")
      );
    }
  };

  return (
    <div className="add-project-container">
      <h2>Create New Project</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Project Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Project Description"
          value={form.description}
          onChange={handleChange}
          required
        />
        <div className="email-list">
          <label>Invite team members (by email):</label>
          {form.inviteEmails.map((email, index) => (
            <input
              key={index}
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(index, e.target.value)}
              placeholder="example@domain.com"
            />
          ))}
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />

          <button
            type="button"
            onClick={addEmailField}
            className="add-email-btn"
          >
            + Add another email
          </button>
        </div>
        <button type="submit">Create Project</button>
      </form>
    </div>
  );
};

export default AddProject;
