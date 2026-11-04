import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Code2,
  BriefcaseBusiness,
  GraduationCap,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
  LockKeyhole,
  LoaderCircle,
} from "lucide-react";
import { apiRequest } from "./services/api";
import "./admin.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("admin_token", result.token);
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-icon"><LockKeyhole size={28} /></div>
        <h1>Welcome Back</h1>
        <p>Sign in to your portfolio dashboard</p>

        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Admin email"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          required
        />

        {error && <div className="admin-error">{error}</div>}

        <button className="admin-primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

function Overview({ user }) {
  const [stats, setStats] = useState({
    projects: 0,
    skills: 0,
    experiences: 0,
    educations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const results = await Promise.all([
          apiRequest("/projects"),
          apiRequest("/skills"),
          apiRequest("/experiences"),
          apiRequest("/education"),
        ]);

        setStats({
          projects: results[0].count,
          skills: results[1].count,
          experiences: results[2].count,
          educations: results[3].count,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const cards = [
    { label: "Projects", value: stats.projects, icon: FolderKanban },
    { label: "Skills", value: stats.skills, icon: Code2 },
    { label: "Experience", value: stats.experiences, icon: BriefcaseBusiness },
    { label: "Education", value: stats.educations, icon: GraduationCap },
  ];

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back, {user?.name || "Admin"}.</p>
        </div>
      </div>

      <div className="admin-stats">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="stat-card" key={card.label}>
              <div className="stat-icon"><Icon size={23} /></div>
              <p>{card.label}</p>
              <h2>{loading ? "..." : card.value}</h2>
            </div>
          );
        })}
      </div>

      <div className="admin-welcome">
        <h2>Your Portfolio Control Center</h2>
        <p>
          Manage your projects, technical skills, professional experience
          and educational background from one place.
        </p>
      </div>
    </>
  );
}


const RESOURCE_CONFIG = {
  projects: {
    title: "Projects",
    endpoint: "/projects",
    collection: "projects",
    fields: [
      { name: "title", label: "Project Title", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "image", label: "Image URL" },
      { name: "liveUrl", label: "Live Website URL" },
      { name: "githubUrl", label: "GitHub URL" },
      { name: "technologies", label: "Technologies (comma separated)" },
      { name: "featured", label: "Featured Project", type: "checkbox" },
      { name: "order", label: "Display Order", type: "number" },
    ],
  },
  skills: {
    title: "Skills",
    endpoint: "/skills",
    collection: "skills",
    fields: [
      { name: "name", label: "Skill Name", required: true },
      { name: "category", label: "Category", required: true },
      { name: "level", label: "Skill Level (0-100)", type: "number" },
      { name: "order", label: "Display Order", type: "number" },
    ],
  },
  experience: {
    title: "Experience",
    endpoint: "/experiences",
    collection: "experiences",
    fields: [
      { name: "company", label: "Company", required: true },
      { name: "position", label: "Position", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "startDate", label: "Start Date", type: "date", required: true },
      { name: "endDate", label: "End Date", type: "date" },
      { name: "current", label: "Currently Working Here", type: "checkbox" },
    ],
  },
  education: {
    title: "Education",
    endpoint: "/education",
    collection: "educations",
    fields: [
      { name: "institution", label: "Institution", required: true },
      { name: "degree", label: "Degree", required: true },
      { name: "field", label: "Field of Study" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "endDate", label: "End Date", type: "date" },
    ],
  },
};

function ResourceManager({ type }) {
  const config = RESOURCE_CONFIG[type];
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest(config.endpoint);
      setItems(result[config.collection] || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [type]);

  function resetForm() {
    setForm({});
    setEditingId(null);
  }

  function editItem(item) {
    const values = {};

    config.fields.forEach((field) => {
      let value = item[field.name];

      if (field.type === "date") {
        value = value ? new Date(value).toISOString().slice(0, 10) : "";
      }

      if (field.name === "technologies") {
        value = Array.isArray(value) ? value.join(", ") : "";
      }

      values[field.name] = value ?? "";
    });

    setForm(values);
    setEditingId(item.id);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = { ...form };

      config.fields.forEach((field) => {
        if (field.type === "number") {
          payload[field.name] =
            payload[field.name] === "" || payload[field.name] === undefined
              ? 0
              : Number(payload[field.name]);
        }

        if (field.name === "technologies") {
          payload.technologies = (payload.technologies || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
        }

        if (field.type === "checkbox") {
          payload[field.name] = Boolean(payload[field.name]);
        }
      });

      await apiRequest(
        editingId ? `${config.endpoint}/${editingId}` : config.endpoint,
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setNotice(editingId ? "Updated successfully!" : "Created successfully!");
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id) {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    setError("");
    setNotice("");

    try {
      await apiRequest(`${config.endpoint}/${id}`, { method: "DELETE" });
      setNotice("Deleted successfully!");
      if (editingId === id) resetForm();
      await loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="admin-heading">
        <h1>{config.title} Management</h1>
        <p>Manage your {config.title.toLowerCase()}.</p>
      </div>

      <div className="admin-panel">
        <h2>{editingId ? "Edit Record" : `Add New ${config.title}`}</h2>

        {error && <div className="admin-error">{error}</div>}
        {notice && <div className="admin-notice">{notice}</div>}

        <form className="admin-form" onSubmit={handleSubmit}>
          {config.fields.map((field) => (
            <div
              key={field.name}
              className={field.type === "textarea" ? "full-width" : ""}
            >
              {field.type === "checkbox" ? (
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(form[field.name])}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                  />
                  {" "}{field.label}
                </label>
              ) : (
                <>
                  <label>{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={form[field.name] ?? ""}
                      required={field.required}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={form[field.name] ?? ""}
                      required={field.required}
                      min={field.name === "level" ? 0 : undefined}
                      max={field.name === "level" ? 100 : undefined}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                    />
                  )}
                </>
              )}
            </div>
          ))}

          <div className="full-width">
            <button className="admin-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Record" : "Create Record"}
            </button>

            {editingId && (
              <button
                type="button"
                className="admin-primary"
                style={{ background: "#475569" }}
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-panel">
        <h2>Existing Records ({items.length})</h2>

        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No records found.</p>
        ) : (
          <div className="admin-list">
            {items.map((item) => (
              <div className="admin-item" key={item.id}>
                <div>
                  <h3>
                    {item.title || item.name || item.company || item.institution}
                  </h3>
                  <p>
                    {item.position || item.category || item.degree ||
                      (item.technologies || []).join(", ") || item.description}
                  </p>
                </div>

                <div className="admin-actions">
                  <button onClick={() => editItem(item)}>Edit</button>
                  <button onClick={() => deleteItem(item.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}


function AboutManager() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fields = [
    { title: "Who I Am", items: [
      ["badge", "Badge"],
      ["heading", "Main Heading"],
      ["description", "Description"],
      ["additionalText", "Additional Text"],
    ]},
    { title: "Professional Experience", items: [
      ["experienceValue", "Value"],
      ["experienceTitle", "Title"],
      ["experienceSubtitle", "Subtitle"],
    ]},
    { title: "Academic Focus", items: [
      ["academicValue", "Value"],
      ["academicTitle", "Title"],
      ["academicSubtitle", "Subtitle"],
    ]},
    { title: "Core Interests", items: [
      ["interestsValue", "Value"],
      ["interestsTitle", "Title"],
      ["interestsSubtitle", "Subtitle"],
    ]},
  ];

  async function loadAbout() {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/about");
      setForm(result.about);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAbout();
  }, []);

  function handleChange(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {};

      fields.forEach((group) => {
        group.items.forEach(([name]) => {
          payload[name] = form[name] || "";
        });
      });

      const result = await apiRequest("/about", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setForm(result.about);
      setNotice("About content updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading About content...</p>;
  }

  return (
    <>
      <div className="admin-heading">
        <h1>About Me Management</h1>
        <p>Manage your About Me section and profile highlights.</p>
      </div>

      <div className="admin-panel">
        {error && <div className="admin-error">{error}</div>}
        {notice && <div className="admin-notice">{notice}</div>}

        <form className="admin-form" onSubmit={handleSubmit}>
          {fields.map((group) => (
            <div className="full-width" key={group.title}>
              <h2 style={{ marginBottom: "18px" }}>
                {group.title}
              </h2>

              <div className="admin-form">
                {group.items.map(([name, label]) => (
                  <div
                    className={
                      name === "description" ||
                      name === "additionalText"
                        ? "full-width"
                        : ""
                    }
                    key={name}
                  >
                    <label>{label}</label>

                    {name === "description" ||
                    name === "additionalText" ? (
                      <textarea
                        rows={5}
                        value={form[name] ?? ""}
                        onChange={(e) =>
                          handleChange(name, e.target.value)
                        }
                      />
                    ) : (
                      <input
                        type="text"
                        value={form[name] ?? ""}
                        onChange={(e) =>
                          handleChange(name, e.target.value)
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="full-width">
            <button className="admin-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}


function SiteSettingsManager() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const groups = [
    { title: "Hero Section", fields: [
      ["heroBadge", "Welcome Badge"], ["heroName", "Name"], ["heroTitles", "Rotating Titles (one per line)", "textarea"],
      ["heroDescription", "Description", "textarea"], ["heroPrimaryText", "Primary Button Text"], ["heroPrimaryUrl", "Primary Button URL"],
      ["heroResumeText", "Resume Button Text"], ["heroResumeUrl", "Resume URL"], ["heroImage", "Profile Image URL"],
      ["heroBadges", "Profile Badges (one per line)", "textarea"],
    ]},
    { title: "Contact Information", fields: [
      ["email", "Email"], ["phone", "Phone"], ["location", "Location"], ["contactDescription", "Contact Description", "textarea"],
      ["githubUrl", "GitHub Profile URL"], ["linkedinUrl", "LinkedIn Profile URL"],
    ]},
    { title: "Footer", fields: [
      ["footerName", "Footer Name"], ["footerDescription", "Footer Description", "textarea"], ["footerCopyright", "Copyright Text"],
    ]},
    { title: "GitHub Repository Auto Display", fields: [
      ["githubUsername", "GitHub Username"],
    ]},
  ];

  useEffect(() => {
    apiRequest("/site-settings").then((result) => setForm(result.settings || {}))
      .catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  function change(name, value) { setForm((old) => ({ ...old, [name]: value })); }

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const result = await apiRequest("/site-settings", { method: "PUT", body: JSON.stringify(form) });
      setForm(result.settings); setNotice("Website settings saved successfully!");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  if (loading) return <p>Loading website settings...</p>;
  return <>
    <div className="admin-heading"><h1>Website Settings</h1><p>Manage Hero, Contact, Footer and automatic GitHub repositories.</p></div>
    <div className="admin-panel">
      {error && <div className="admin-error">{error}</div>}
      {notice && <div className="admin-notice">{notice}</div>}
      <form className="admin-form" onSubmit={submit}>
        {groups.map((group) => <div className="full-width" key={group.title}>
          <h2 style={{ marginBottom: 18 }}>{group.title}</h2>
          <div className="admin-form">
            {group.fields.map(([name, label, type]) => <div className={type === "textarea" ? "full-width" : ""} key={name}>
              <label>{label}</label>
              {type === "textarea" ? <textarea rows={4} value={form[name] ?? ""} onChange={(e) => change(name, e.target.value)} /> :
                <input type="text" value={form[name] ?? ""} onChange={(e) => change(name, e.target.value)} />}
            </div>)}
          </div>
          {group.title === "Hero Section" && <div className="full-width" style={{ marginTop: 12 }}>
            <label>Upload Profile Picture</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 3 * 1024 * 1024) {
                  setError("Please choose an image smaller than 3 MB.");
                  e.target.value = "";
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => change("heroImage", String(reader.result));
                reader.onerror = () => setError("Could not read the selected image.");
                reader.readAsDataURL(file);
              }}
            />
            {form.heroImage && <div style={{ marginTop: 12 }}>
              <img src={form.heroImage} alt="Profile preview" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: "50%", border: "2px solid #64748b" }} />
              <p style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>Profile picture preview</p>
            </div>}
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>PNG, JPG, WEBP or GIF · Maximum 3 MB. Click Save Website Settings to publish.</p>
          </div>}
          {group.title === "GitHub Repository Auto Display" && <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
            <input type="checkbox" checked={Boolean(form.showGithubRepos)} onChange={(e) => change("showGithubRepos", e.target.checked)} />
            Automatically show public repositories on the website
          </label>}
        </div>)}
        <div className="full-width"><button className="admin-primary" disabled={saving}>{saving ? "Saving..." : "Save Website Settings"}</button></div>
      </form>
    </div>
  </>;
}


function AdminApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const result = await apiRequest("/auth/me");
        setUser(result.user);
      } catch {
        localStorage.removeItem("admin_token");
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, []);

  function logout() {
    localStorage.removeItem("admin_token");
    setUser(null);
    navigate("/admin");
  }

  if (checking) {
    return <div className="admin-loading"><LoaderCircle className="spin" /> Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={(loggedInUser) => {
      setUser(loggedInUser);
      navigate("/admin/dashboard");
    }} />;
  }

  const navigation = [
    { label: "Overview", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Projects", path: "/admin/projects", icon: FolderKanban },
    { label: "Skills", path: "/admin/skills", icon: Code2 },
    { label: "Experience", path: "/admin/experience", icon: BriefcaseBusiness },
    { label: "Education", path: "/admin/education", icon: GraduationCap },
    { label: "About Me", path: "/admin/about", icon: UserRound },
    { label: "Website Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="admin-layout">
      {mobileMenu && (
        <button className="mobile-close" onClick={() => setMobileMenu(false)}>
          <X />
        </button>
      )}

      <aside className={`admin-sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="admin-brand">PRITUM<span>.</span></div>

        <p className="sidebar-label">WORKSPACE</p>

        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${window.location.pathname === item.path ? "active" : ""}`}
              onClick={() => setMobileMenu(false)}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}

        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={19} /> Sign Out
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button className="mobile-menu" onClick={() => setMobileMenu(true)}>
            <Menu />
          </button>
          <span>Admin Workspace</span>
          <span className="admin-user">{user.name}</span>
        </header>

        <div className="admin-content">
         <Routes>
  <Route path="projects" element={<ResourceManager type="projects" />} />
  <Route path="skills" element={<ResourceManager type="skills" />} />
  <Route path="experience" element={<ResourceManager type="experience" />} />
  <Route path="education" element={<ResourceManager type="education" />} />
  <Route path="about" element={<AboutManager />} />
  <Route path="settings" element={<SiteSettingsManager />} />
  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
</Routes>
        </div>
      </main>
    </div>
  );
}

export default AdminApp;