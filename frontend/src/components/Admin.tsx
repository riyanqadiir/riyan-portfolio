import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Logout from "@mui/icons-material/Logout";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Add from "@mui/icons-material/Add";
import AdminExpertiseSection from "./admin/AdminExpertiseSection";
import AdminTimelineSection from "./admin/AdminTimelineSection";
import AdminResumeSection from "./admin/AdminResumeSection";
import AdminProfilePhotoSection from "./admin/AdminProfilePhotoSection";

type AdminTab = "projects" | "expertise" | "timeline" | "resume" | "profile-photo";

interface ProjectItem {
  _id?: string;
  title: string;
  description: string;
  image: string;
  imageUrl?: string;
  link: string;
}

interface AdminProps {
  mode: string;
}

function Admin({ mode }: AdminProps) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem("adminToken"));
  
  // Login states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Projects states
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  
  // Form states (Add/Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("projects");

  // Load projects if logged in
  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (err) {
      console.error("Error loading projects", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("adminToken", data.token);
        setToken(data.token);
        setUsername("");
        setPassword("");
      } else {
        setLoginError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setLoginError("Failed to connect to authentication server.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setToken(null);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormTitle("");
    setFormDescription("");
    setFormImage("");
    setFormLink("");
    setFormError("");
    setShowForm(true);
  };

  const handleOpenEdit = (project: ProjectItem) => {
    setEditingId(project._id || null);
    setFormTitle(project.title);
    setFormDescription(project.description);
    setFormImage(project.image);
    setFormLink(project.link);
    setFormError("");
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setFormError("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/projects/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setFormImage(data.imageKey);
      } else {
        if (res.status === 401) {
          handleLogout();
        } else {
          setFormError(data.message || "Failed to upload image to S3.");
        }
      }
    } catch (err) {
      setFormError("Network error uploading image to AWS S3.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle || !formDescription || !formImage || !formLink) {
      setFormError("All fields are required.");
      return;
    }

    setFormLoading(true);
    const url = editingId ? `/api/projects/${editingId}` : "/api/projects";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          image: formImage,
          link: formLink,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowForm(false);
        fetchProjects();
      } else {
        if (res.status === 401) {
          handleLogout();
        } else if (data.errors && Array.isArray(data.errors)) {
          setFormError(data.errors.map((e: { message: string }) => e.message).join(", "));
        } else {
          setFormError(data.message || "Operation failed.");
        }
      }
    } catch (err) {
      setFormError("Server error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchProjects();
      } else {
        if (res.status === 401) {
          handleLogout();
        } else {
          alert("Failed to delete project.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting project.");
    }
  };

  // Color variables based on mode
  const isDark = mode === "dark";
  const bgColor = isDark ? "#0f172a" : "#f8fafc";
  const cardColor = isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.85)";
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const subTextColor = isDark ? "#94a3b8" : "#475569";
  const primaryColor = "#5000ca";
  const inputBgColor = isDark ? "#1e293b" : "#ffffff";
  const inputBorderColor = isDark ? "#334155" : "#cbd5e1";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: "Outfit, Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        transition: "all 0.3s ease",
      }}
    >
      {/* HEADER SECTION */}
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: textColor,
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "16px",
            padding: "8px 12px",
            borderRadius: "6px",
            transition: "background 0.2s",
            height: "44px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <ArrowBack fontSize="small" /> Back to Site
        </button>

        {token && (
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
              color: textColor,
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "14px",
              padding: "8px 16px",
              borderRadius: "6px",
              transition: "all 0.2s",
              height: "44px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDark ? "#334155" : "#cbd5e1";
              e.currentTarget.style.color = textColor;
            }}
          >
            <Logout fontSize="small" /> Logout
          </button>
        )}
      </div>

      {/* LOGIN PAGE */}
      {!token ? (
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            backgroundColor: cardColor,
            backdropFilter: "blur(12px)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            borderRadius: "16px",
            padding: "40px 30px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            marginTop: "40px",
          }}
        >
          <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px", textAlign: "center" }}>
            Admin Portal
          </h2>
          <p style={{ color: subTextColor, fontSize: "14px", textAlign: "center", marginBottom: "30px" }}>
            Log in to manage your portfolio projects
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {loginError && (
              <div
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                {loginError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="login-username" style={{ fontSize: "14px", fontWeight: 500, color: subTextColor }}>
                Username
              </label>
              <input
                id="login-username"
                type="text"
                placeholder="Enter admin username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  height: "48px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  border: `2px solid ${inputBorderColor}`,
                  backgroundColor: inputBgColor,
                  color: textColor,
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = primaryColor)}
                onBlur={(e) => (e.currentTarget.style.borderColor = inputBorderColor)}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", position: "relative" }}>
              <label htmlFor="login-password" style={{ fontSize: "14px", fontWeight: 500, color: subTextColor }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    height: "48px",
                    padding: "0 48px 0 16px",
                    borderRadius: "8px",
                    border: `2px solid ${inputBorderColor}`,
                    backgroundColor: inputBgColor,
                    color: textColor,
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = primaryColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = inputBorderColor)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: subTextColor,
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                    minHeight: "40px",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                height: "48px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: primaryColor,
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 600,
                cursor: loginLoading ? "not-allowed" : "pointer",
                marginTop: "10px",
                boxShadow: "0 4px 12px rgba(80, 0, 202, 0.3)",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loginLoading) e.currentTarget.style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {loginLoading ? "Verifying..." : "Login"}
            </button>
          </form>
        </div>
      ) : (
        /* DASHBOARD PAGE */
        <div style={{ width: "100%", maxWidth: "1000px" }}>
          {/* ACTIONS BAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <div>
              <h2 style={{ fontSize: "32px", fontWeight: 800 }}>Dashboard</h2>
              <p style={{ color: subTextColor, fontSize: "15px" }}>
                Manage projects, expertise, career history, resume, and profile photo
              </p>
            </div>
            {activeTab === "projects" && !showForm && (
              <button
                onClick={handleOpenAdd}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: primaryColor,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontWeight: 600,
                  fontSize: "15px",
                  cursor: "pointer",
                  height: "44px",
                  boxShadow: "0 4px 12px rgba(80, 0, 202, 0.2)",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Add fontSize="small" /> Add Project
              </button>
            )}
          </div>

          {/* TABS */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {(
              [
                ["projects", "Projects"],
                ["expertise", "Expertise"],
                ["timeline", "Career History"],
                ["resume", "Resume"],
                ["profile-photo", "Profile Photo"],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setShowForm(false);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: `1px solid ${activeTab === tab ? primaryColor : isDark ? "#334155" : "#cbd5e1"}`,
                  backgroundColor: activeTab === tab ? primaryColor : "transparent",
                  color: activeTab === tab ? "#fff" : textColor,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "expertise" && token && (
            <AdminExpertiseSection
              token={token}
              isDark={isDark}
              cardColor={cardColor}
              textColor={textColor}
              subTextColor={subTextColor}
              inputBgColor={inputBgColor}
              inputBorderColor={inputBorderColor}
              primaryColor={primaryColor}
              onAuthError={handleLogout}
            />
          )}

          {activeTab === "timeline" && token && (
            <AdminTimelineSection
              token={token}
              isDark={isDark}
              cardColor={cardColor}
              textColor={textColor}
              subTextColor={subTextColor}
              inputBgColor={inputBgColor}
              inputBorderColor={inputBorderColor}
              primaryColor={primaryColor}
              onAuthError={handleLogout}
            />
          )}

          {activeTab === "resume" && token && (
            <AdminResumeSection
              token={token}
              isDark={isDark}
              cardColor={cardColor}
              textColor={textColor}
              subTextColor={subTextColor}
              inputBorderColor={inputBorderColor}
              primaryColor={primaryColor}
              onAuthError={handleLogout}
            />
          )}

          {activeTab === "profile-photo" && token && (
            <AdminProfilePhotoSection
              token={token}
              isDark={isDark}
              cardColor={cardColor}
              textColor={textColor}
              subTextColor={subTextColor}
              primaryColor={primaryColor}
              onAuthError={handleLogout}
            />
          )}

          {activeTab === "projects" && (
          <>
          {/* PROJECT EDITOR FORM */}
          {showForm && (
            <div
              style={{
                backgroundColor: cardColor,
                borderRadius: "12px",
                padding: "30px",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                marginBottom: "40px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>
                {editingId ? "Edit Project" : "Add New Project"}
              </h3>

              <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {formError && (
                  <div
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#f87171",
                      padding: "12px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    {formError}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label htmlFor="form-title" style={{ fontSize: "14px", fontWeight: 500, color: subTextColor }}>
                      Project Title*
                    </label>
                    <input
                      id="form-title"
                      type="text"
                      placeholder="e.g. My Awesome App"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      style={{
                        height: "44px",
                        padding: "0 14px",
                        borderRadius: "6px",
                        border: `2px solid ${inputBorderColor}`,
                        backgroundColor: inputBgColor,
                        color: textColor,
                        outline: "none",
                        fontSize: "15px",
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label htmlFor="form-link" style={{ fontSize: "14px", fontWeight: 500, color: subTextColor }}>
                      Project URL Link*
                    </label>
                    <input
                      id="form-link"
                      type="text"
                      placeholder="e.g. https://github.com/..."
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                      style={{
                        height: "44px",
                        padding: "0 14px",
                        borderRadius: "6px",
                        border: `2px solid ${inputBorderColor}`,
                        backgroundColor: inputBgColor,
                        color: textColor,
                        outline: "none",
                        fontSize: "15px",
                      }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="form-image" style={{ fontSize: "14px", fontWeight: 500, color: subTextColor }}>
                    Image Path or URL*
                  </label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      id="form-image"
                      type="text"
                      placeholder="e.g. /TaskMaster.png or https://image-url.com"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      style={{
                        flex: 1,
                        height: "44px",
                        padding: "0 14px",
                        borderRadius: "6px",
                        border: `2px solid ${inputBorderColor}`,
                        backgroundColor: inputBgColor,
                        color: textColor,
                        outline: "none",
                        fontSize: "15px",
                      }}
                      required
                    />
                    
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 16px",
                        height: "44px",
                        borderRadius: "6px",
                        backgroundColor: isDark ? "#334155" : "#e2e8f0",
                        color: textColor,
                        cursor: uploadLoading ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        fontSize: "14px",
                        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                        whiteSpace: "nowrap",
                        transition: "opacity 0.2s",
                      }}
                    >
                      {uploadLoading ? "Uploading..." : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadLoading}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                  <span style={{ fontSize: "12px", color: subTextColor }}>
                    Tip: Paste a URL, or click "Upload Image" to upload a local file directly to your AWS S3 bucket.
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label htmlFor="form-desc" style={{ fontSize: "14px", fontWeight: 500, color: subTextColor }}>
                    Description*
                  </label>
                  <textarea
                    id="form-desc"
                    placeholder="Describe what you built, technologies used..."
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "6px",
                      border: `2px solid ${inputBorderColor}`,
                      backgroundColor: inputBgColor,
                      color: textColor,
                      outline: "none",
                      fontSize: "15px",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "6px",
                      border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                      background: "none",
                      color: textColor,
                      fontWeight: 500,
                      cursor: "pointer",
                      height: "44px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: primaryColor,
                      color: "#ffffff",
                      fontWeight: 600,
                      cursor: formLoading ? "not-allowed" : "pointer",
                      height: "44px",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!formLoading) e.currentTarget.style.opacity = "0.9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {formLoading ? "Saving..." : "Save Project"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PROJECT LIST */}
          {projectsLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: subTextColor }}>
              <p>Loading projects list...</p>
            </div>
          ) : projects.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                backgroundColor: cardColor,
                borderRadius: "12px",
                border: `1px dashed ${isDark ? "#334155" : "#cbd5e1"}`,
              }}
            >
              <p style={{ color: subTextColor, fontSize: "16px", marginBottom: "15px" }}>
                No projects found in database.
              </p>
              <button
                onClick={handleOpenAdd}
                style={{
                  backgroundColor: "transparent",
                  border: `1px solid ${primaryColor}`,
                  color: textColor,
                  borderRadius: "6px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Add Your First Project
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {projects.map((project) => (
                <div
                  key={project._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: cardColor,
                    borderRadius: "12px",
                    padding: "20px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"}`,
                    gap: "20px",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                >
                  <img
                    src={project.imageUrl || project.image}
                    alt={project.title}
                    style={{
                      width: "120px",
                      height: "80px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      backgroundColor: "#1e293b",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/120x80?text=No+Image";
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                      {project.title}
                    </h4>
                    <p
                      style={{
                        color: subTextColor,
                        fontSize: "14px",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {project.description}
                    </p>
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "12px",
                        color: "#818cf8",
                        textDecoration: "none",
                        wordBreak: "break-all",
                        marginTop: "6px",
                        display: "inline-block",
                      }}
                    >
                      {project.link}
                    </a>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleOpenEdit(project)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDark ? "#334155" : "#e2e8f0",
                        color: textColor,
                        border: "none",
                        width: "40px",
                        height: "40px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "opacity 0.2s",
                      }}
                      aria-label="Edit project"
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      onClick={() => project._id && handleDeleteProject(project._id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        border: "none",
                        width: "40px",
                        height: "40px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      aria-label="Delete project"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)")}
                    >
                      <Delete fontSize="small" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;
