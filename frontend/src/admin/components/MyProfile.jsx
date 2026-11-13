import { useState } from "react";
import { apiRequest } from "../../services/api";

function MyProfile({ currentUser, onUpdated }) {
  const [name, setName] = useState(currentUser?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = { name };
    if (currentPassword || newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    try {
      const result = await apiRequest("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setName(result.user.name);
      setCurrentPassword("");
      setNewPassword("");
      onUpdated?.(result.user);
      setNotice("Your profile has been updated.");
    } catch (err) {
      setError(err.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="admin-heading">
        <h1>My Profile</h1>
        <p>Update your display name and account password.</p>
      </div>
      <div className="admin-panel">
        {error && <div className="admin-error" role="alert">{error}</div>}
        {notice && <div className="admin-notice" role="status">{notice}</div>}
        <form className="admin-form" onSubmit={submit}>
          <div>
            <label htmlFor="profile-name">Display Name</label>
            <input id="profile-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="profile-email">Login Email</label>
            <input id="profile-email" value={currentUser?.email || ""} disabled readOnly />
            <p className="admin-help">Email changes are not enabled here. Contact the Super Admin if your login email needs to change.</p>
          </div>
          <div className="full-width"><h2>Change Password</h2></div>
          <div>
            <label htmlFor="profile-current-password">Current Password</label>
            <input id="profile-current-password" type="password" value={currentPassword} autoComplete="current-password" onChange={(event) => setCurrentPassword(event.target.value)} />
          </div>
          <div>
            <label htmlFor="profile-new-password">New Password</label>
            <input id="profile-new-password" type="password" value={newPassword} minLength={12} maxLength={128} autoComplete="new-password" onChange={(event) => setNewPassword(event.target.value)} />
            <p className="admin-help">At least 12 characters. Leave both password fields blank to update only your name.</p>
          </div>
          <div className="full-width">
            <button className="admin-primary" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</button>
          </div>
        </form>
      </div>
    </>
  );
}

export default MyProfile;
