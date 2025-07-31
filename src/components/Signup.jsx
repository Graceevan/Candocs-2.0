import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Signup.css";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    groupName: "",
    role: "",
    dateOfBirth: "",
    mobileNumber: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const { mobileNumber, dateOfBirth } = formData;

    // ✅ Mobile number validation (10 digits, must start with 6–9)
    const cleanedMobile = mobileNumber.replace(/\D/g, "");
    if (!/^[0-9]\d{9}$/.test(cleanedMobile)) {
      setError("Please enter a valid 10-digit mobile number starting with 0-9.");
      setLoading(false);
      return;
    }

    // ✅ Age validation: must be at least 18
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();

    const is18OrOlder =
      age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));

    if (!is18OrOlder) {
      setError("You must be at least 18 years old to register.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/candocspro/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to register. Try again.");
      }

      setSuccessMsg("Account created successfully!");
      setTimeout(() => navigate("/"), 1500); // Redirect to login
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-title">Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="forms-grid">
            <div className="forms-group">
              <label htmlFor="userName">Username</label>
              <input
                type="text"
                name="userName"
                placeholder="Enter your username"
                value={formData.userName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="forms-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="forms-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="forms-group">
              <label htmlFor="groupName">Group Name</label>
              <input
                type="text"
                name="groupName"
                placeholder="Enter your group"
                value={formData.groupName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="forms-group">
              <label htmlFor="role">Role</label>
              <input
                type="text"
                name="role"
                placeholder="Enter your role"
                value={formData.role}
                onChange={handleChange}
                required
              />
            </div>

            <div className="forms-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                max={new Date(
                  new Date().setFullYear(new Date().getFullYear() - 18)
                )
                  .toISOString()
                  .split("T")[0]}
              />
            </div>

            <div className="forms-group">
              <label htmlFor="mobileNumber">Mobile Number</label>
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Enter your mobile"
                value={formData.mobileNumber}
                onChange={handleChange}
                maxLength="10"
                required
              />
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}
          {successMsg && (
            <p style={{ color: "green", marginTop: "10px" }}>{successMsg}</p>
          )}

          <div className="button-wrapper">
            <button type="submit" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Signup;
