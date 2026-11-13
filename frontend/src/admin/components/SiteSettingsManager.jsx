import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

const MAX_PROFILE_IMAGE_BYTES = 650 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function SiteSettingsManager({ currentUser }) {
  const canEdit = currentUser?.role === "SUPER_ADMIN" ||
    Boolean(currentUser?.permissions?.some((item) => item.section === "settings" && item.canEdit));
  const [form, setForm] = useState({});
  const [originalHeroImage, setOriginalHeroImage] = useState("");
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
    apiRequest("/site-settings")
      .then((result) => {
        const settings = result.settings || {};
        setForm(settings);
        setOriginalHeroImage(settings.heroImage || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function change(name, value) {
    setForm((old) => ({ ...old, [name]: value }));
  }

  function handleProfileImageChange(event) {
    if (!canEdit) return;
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_PROFILE_IMAGE_TYPES.has(file.type)) {
      setError("Choose a PNG, JPG, WEBP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setError("Choose an image smaller than 650 KB.");
      event.target.value = "";
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") change("heroImage", reader.result);
      else setError("Could not read the selected image.");
    };
    reader.onerror = () => setError("Could not read the selected image.");
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = { ...form };
      if (payload.heroImage === originalHeroImage) delete payload.heroImage;
      const result = await apiRequest("/site-settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const settings = result.settings || {};
      setForm(settings);
      setOriginalHeroImage(settings.heroImage || "");
      setNotice("Website settings saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-panel"><p>Loading website settings...</p></div>;

  return (
    <>
      <div className="admin-heading"><h1>Website Settings</h1><p>Manage Hero, Contact, Footer and automatic GitHub repositories.</p></div>
      <div className="admin-panel">
        {error && <div className="admin-error" role="alert">{error}</div>}
        {notice && <div className="admin-notice" role="status">{notice}</div>}
        {!canEdit && <p className="admin-help">You have view-only access to this section.</p>}
        <form className="admin-form" onSubmit={submit}>
          {groups.map((group) => (
            <div className="full-width" key={group.title}>
              <h2 style={{ marginBottom: 18 }}>{group.title}</h2>
              <div className="admin-form">
                {group.fields.map(([name, label, type]) => (
                  <div className={type === "textarea" ? "full-width" : ""} key={name}>
                    <label htmlFor={`setting-${name}`}>{label}</label>
                    {type === "textarea" ? (
                      <textarea id={`setting-${name}`} rows={4} disabled={!canEdit} value={form[name] ?? ""} onChange={(e) => change(name, e.target.value)} />
                    ) : (
                      <input id={`setting-${name}`} type="text" disabled={!canEdit} value={form[name] ?? ""} onChange={(e) => change(name, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
              {group.title === "Hero Section" && (
                <div className="full-width" style={{ marginTop: 12 }}>
                  {canEdit && <>
                    <label htmlFor="profile-picture-upload">Upload Profile Picture</label>
                    <input id="profile-picture-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleProfileImageChange} />
                  </>}
                  {form.heroImage && <div style={{ marginTop: 12 }}>
                    <img src={form.heroImage} alt="Profile preview" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: "50%", border: "2px solid #64748b" }} />
                    <p style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>Profile picture preview</p>
                  </div>}
                  {canEdit && <p style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>PNG, JPG, WEBP or GIF · Maximum 650 KB. Click Save Website Settings to publish.</p>}
                </div>
              )}
              {group.title === "GitHub Repository Auto Display" && (
                <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
                  <input type="checkbox" disabled={!canEdit} checked={Boolean(form.showGithubRepos)} onChange={(e) => change("showGithubRepos", e.target.checked)} />
                  Automatically show public repositories on the website
                </label>
              )}
            </div>
          ))}
          {canEdit && <div className="full-width"><button className="admin-primary" disabled={saving}>{saving ? "Saving..." : "Save Website Settings"}</button></div>}
        </form>
      </div>
    </>
  );
}

export default SiteSettingsManager;
