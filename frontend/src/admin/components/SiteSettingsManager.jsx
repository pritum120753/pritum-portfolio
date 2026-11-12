import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

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

export default SiteSettingsManager;
