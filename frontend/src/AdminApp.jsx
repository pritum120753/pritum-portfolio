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
  Users,
  LogOut,
  Menu,
  X,
  LoaderCircle,
} from "lucide-react";
import { apiRequest } from "./services/api";
import AdminLogin from "./admin/components/AdminLogin.jsx";
import AdminOverview from "./admin/components/AdminOverview.jsx";
import ResourceManager from "./admin/components/ResourceManager.jsx";
import AboutManager from "./admin/components/AboutManager.jsx";
import SiteSettingsManager from "./admin/components/SiteSettingsManager.jsx";
import AdminManagement from "./admin/components/AdminManagement.jsx";
import "./admin.css";

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
    return <AdminLogin onLogin={(loggedInUser) => {
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
    { label: "Admin Management", path: "/admin/admins", icon: Users },
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
  <Route path="dashboard" element={<AdminOverview user={user} />} />
  <Route path="projects" element={<ResourceManager type="projects" />} />
  <Route path="skills" element={<ResourceManager type="skills" />} />
  <Route path="experience" element={<ResourceManager type="experience" />} />
  <Route path="education" element={<ResourceManager type="education" />} />
  <Route path="about" element={<AboutManager />} />
  <Route path="settings" element={<SiteSettingsManager />} />
  <Route path="admins" element={<AdminManagement currentUser={user} />} />
  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
</Routes>
        </div>
      </main>
    </div>
  );
}

export default AdminApp;