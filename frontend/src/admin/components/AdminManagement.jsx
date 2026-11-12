import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { apiRequest } from "../../services/api";

const EMPTY_FORM = { name: "", email: "", password: "" };

function AdminManagement({ currentUser }) {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadAdmins() {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest("/auth/admins");
      setAdmins(result.admins || []);
    } catch (err) {
      setError(err.message || "Could not load admin accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  function change(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function resetForm() {
    setShowPassword(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEdit(admin) {
    setShowPassword(false);
    setForm({ name: admin.name, email: admin.email, password: "" });
    setEditingId(admin.id);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      name: form.name,
      email: form.email,
    };
    if (form.password) payload.password = form.password;

    try {
      const result = await apiRequest(
        editingId ? `/auth/admins/${editingId}` : "/auth/admins",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setNotice(result.message || (editingId
        ? "Admin account updated successfully."
        : "Admin account created successfully."));
      resetForm();
      await loadAdmins();
    } catch (err) {
      setError(err.message || "Could not save the admin account.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAdmin(admin) {
    if (admin.id === currentUser?.id) {
      setError("You cannot delete your own admin account.");
      return;
    }

    const confirmed = window.confirm(
      `Delete the admin account for ${admin.name} (${admin.email})? This will revoke their access.`
    );
    if (!confirmed) return;

    setDeletingId(admin.id);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/auth/admins/${admin.id}`, {
        method: "DELETE",
      });
      setNotice(result.message || "Admin account deleted successfully.");
      if (editingId === admin.id) resetForm();
      await loadAdmins();
    } catch (err) {
      setError(err.message || "Could not delete the admin account.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="admin-heading">
        <h1>Admin Management</h1>
        <p>Create and manage the people who can access your portfolio dashboard.</p>
      </div>

      <div className="admin-panel">
        <h2>{editingId ? "Edit Admin Account" : "Add a New Admin"}</h2>
        <p className="admin-help">
          All admin accounts have full dashboard access. Use a unique email and a password with at least 12 characters.
        </p>

        {error && <div className="admin-error" role="alert">{error}</div>}
        {notice && <div className="admin-notice" role="status">{notice}</div>}

        <form className="admin-form" onSubmit={submit}>
          <div>
            <label htmlFor="admin-name">Full Name</label>
            <input
              id="admin-name"
              type="text"
              value={form.name}
              onChange={(event) => change("name", event.target.value)}
              maxLength={80}
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(event) => change("email", event.target.value)}
              maxLength={254}
              autoComplete="email"
              required
            />
          </div>

          <div className="full-width">
            <label htmlFor="admin-password">
              {editingId ? "New Password (optional)" : "Password"}
            </label>
            <div className="password-field">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => change("password", event.target.value)}
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required={!editingId}
                placeholder={editingId ? "Leave blank to keep the current password" : "At least 12 characters"}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {editingId && (
              <p className="admin-help">Leave this blank to keep the current password unchanged.</p>
            )}
          </div>

          <div className="full-width admin-admin-form-actions">
            <button className="admin-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Admin Changes" : "Create Admin Account"}
            </button>
            {editingId && (
              <button
                type="button"
                className="admin-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-admin-list-heading">
          <h2>Admin Accounts</h2>
          <span>{admins.length} total</span>
        </div>

        {loading ? (
          <p>Loading admin accounts...</p>
        ) : admins.length === 0 ? (
          <p>No admin accounts were found.</p>
        ) : (
          <div className="admin-admin-list">
            {admins.map((admin) => {
              const isCurrentUser = admin.id === currentUser?.id;
              return (
                <div className="admin-admin-card" key={admin.id}>
                  <div className="admin-admin-details">
                    <div className="admin-admin-name">
                      <h3>{admin.name}</h3>
                      {isCurrentUser && <span className="admin-you-label">You</span>}
                    </div>
                    <p>{admin.email}</p>
                    <span className="admin-admin-date">
                      Added {admin.createdAt
                        ? new Date(admin.createdAt).toLocaleDateString()
                        : "date unavailable"}
                    </span>
                  </div>

                  <div className="admin-actions">
                    <button type="button" onClick={() => startEdit(admin)}>Edit</button>
                    <button
                      type="button"
                      onClick={() => removeAdmin(admin)}
                      disabled={isCurrentUser || deletingId === admin.id}
                      title={isCurrentUser ? "You cannot delete your own account" : "Delete admin"}
                    >
                      {deletingId === admin.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default AdminManagement;
