// Enhanced Login.jsx with loading, toast, and subtle animations

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./../styles/Login.css";
import { motion } from "framer-motion";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", form);
    
    const { token, user } = res.data; // ✅ extract user
    localStorage.setItem("token", token);
    localStorage.setItem("userId", user._id);
    const currentUserId = localStorage.getItem("userId");

    console.log("Logged in user ID:", currentUserId);

    toast.success("Login successful! Redirecting...");
    setTimeout(() => navigate("/"), 2000);
  } catch (err) {
    toast.error("Invalid credentials");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="animated-bg">
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </motion.div>
      <ToastContainer position="top-center" autoClose={2500} hideProgressBar />
    </div>
  );
};

export default Login;
