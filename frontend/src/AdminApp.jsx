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
  ShieldCheck,
  ClipboardList,
  History,
  UserCircle,
} from "lucide-react";
import { apiRequest } from "./services/api";
import AdminLogin from "./admin/components/AdminLogin.jsx";
import AdminOverview from "./admin/components/AdminOverview.jsx";
import ResourceManager from "./admin/components/ResourceManager.jsx";
import AboutManager from "./admin/components/AboutManager.jsx";
import SiteSettingsManager from "./admin/components/SiteSettingsManager.jsx";
import AdminManagement from "./admin/components/AdminManagement.jsx";
import MyProfile from "./admin/components/MyProfile.jsx";
import AdminGovernance from "./admin/components/AdminGovernance.jsx";
import "./admin.css";

function AdminApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

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

  const sectionPermission = (section) =>
    isSuperAdmin || user.permissions?.some((permission) =>
      permission.section === section && permission.canView
    );

  const navigation = [
    { label: "Overview", path: "/admin/dashboard", icon: LayoutDashboard },
    ...(sectionPermission("projects") ? [{ label: "Projects", path: "/admin/projects", icon: FolderKanban }] : []),
    ...(sectionPermission("skills") ? [{ label: "Skills", path: "/admin/skills", icon: Code2 }] : []),
    ...(sectionPermission("experience") ? [{ label: "Experience", path: "/admin/experience", icon: BriefcaseBusiness }] : []),
    ...(sectionPermission("education") ? [{ label: "Education", path: "/admin/education", icon: GraduationCap }] : []),
    ...(sectionPermission("about") ? [{ label: "About Me", path: "/admin/about", icon: UserRound }] : []),
    ...(sectionPermission("settings") ? [{ label: "Website Settings", path: "/admin/settings", icon: Settings }] : []),
    { label: "My Profile", path: "/admin/profile", icon: UserCircle },
    { label: "Requests", path: "/admin/requests", icon: ClipboardList },
    ...(isSuperAdmin ? [
      { label: "Admin Management", path: "/admin/admins", icon: Users },
      { label: "Permission Control", path: "/admin/permissions", icon: ShieldCheck },
      { label: "Activity History", path: "/admin/history", icon: History },
    ] : []),
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
          <span className="admin-user">
            {user.name}
            <span className={`admin-role-chip ${isSuperAdmin ? "super-admin" : ""}`}>
              {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
            </span>
          </span>
        </header>

        <div className="admin-content">
          <Routes>
            <Route path="dashboard" element={<AdminOverview user={user} />} />
            <Route path="projects" element={sectionPermission("projects") ? <ResourceManager type="projects" /> : <Navigate to="/admin/dashboard" replace />} />
            <Route path="skills" element={sectionPermission("skills") ? <ResourceManager type="skills" /> : <Navigate to="/admin/dashboard" replace />} />
            <Route path="experience" element={sectionPermission("experience") ? <ResourceManager type="experience" /> : <Navigate to="/admin/dashboard" replace />} />
            <Route path="education" element={sectionPermission("education") ? <ResourceManager type="education" /> : <Navigate to="/admin/dashboard" replace />} />
            <Route path="about" element={sectionPermission("about") ? <AboutManager /> : <Navigate to="/admin/dashboard" replace />} />
            <Route path="settings" element={sectionPermission("settings") ? <SiteSettingsManager /> : <Navigate to="/admin/dashboard" replace />} />
            <Route path="profile" element={<MyProfile currentUser={user} onUpdated={(updated) => setUser((previous) => ({ ...previous, ...updated }))} />} />
            <Route path="requests" element={<AdminGovernance mode="requests" currentUser={user} />} />
            <Route
              path="admins"
              element={isSuperAdmin
                ? <AdminManagement currentUser={user} />
                : <Navigate to="/admin/dashboard" replace />}
            />
            <Route path="permissions" element={isSuperAdmin ? <AdminGovernance mode="permissions" currentUser={user} /> : <Navigate to="/admin/dashboard" replace />} />
            <Route path="history" element={isSuperAdmin ? <AdminGovernance mode="history" currentUser={user} /> : <Navigate to="/admin/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default AdminApp;
