import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

function AboutManager({ currentUser }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canEdit = currentUser?.role === "SUPER_ADMIN" ||
    Boolean(currentUser?.permissions?.some((item) => item.section === "about" && item.canEdit));

  const fields = [
    { title: "Who I Am", items: [
      ["badge", "Badge"], ["heading", "Main Heading"], ["description", "Description"], ["additionalText", "Additional Text"],
    ]},
    { title: "Professional Experience", items: [
      ["experienceValue", "Value"], ["experienceTitle", "Title"], ["experienceSubtitle", "Subtitle"],
    ]},
    { title: "Academic Focus", items: [
      ["academicValue", "Value"], ["academicTitle", "Title"], ["academicSubtitle", "Subtitle"],
    ]},
    { title: "Core Interests", items: [
      ["interestsValue", "Value"], ["interestsTitle", "Title"], ["interestsSubtitle", "Subtitle"],
    ]},
  ];

  useEffect(() => {
    apiRequest("/about")
      .then((result) => setForm(result.about || {}))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {};
      fields.forEach((group) => group.items.forEach(([name]) => { payload[name] = form[name] || ""; }));
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

  if (loading) return <div className="admin-panel"><p>Loading About content...</p></div>;

  return (
    <>
      <div className="admin-heading">
        <h1>About Me Management</h1>
        <p>Manage your About Me section and profile highlights.</p>
      </div>
      <div className="admin-panel">
        {error && <div className="admin-error" role="alert">{error}</div>}
        {notice && <div className="admin-notice" role="status">{notice}</div>}
        {!canEdit && <p className="admin-help">You have view-only access to this section.</p>}
        <form className="admin-form" onSubmit={handleSubmit}>
          {fields.map((group) => (
            <div className="full-width" key={group.title}>
              <h2 style={{ marginBottom: "18px" }}>{group.title}</h2>
              <div className="admin-form">
                {group.items.map(([name, label]) => (
                  <div className={name === "description" || name === "additionalText" ? "full-width" : ""} key={name}>
                    <label htmlFor={`about-${name}`}>{label}</label>
                    {name === "description" || name === "additionalText" ? (
                      <textarea id={`about-${name}`} rows={5} disabled={!canEdit} value={form[name] ?? ""} onChange={(e) => handleChange(name, e.target.value)} />
                    ) : (
                      <input id={`about-${name}`} type="text" disabled={!canEdit} value={form[name] ?? ""} onChange={(e) => handleChange(name, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {canEdit && <div className="full-width"><button className="admin-primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></div>}
        </form>
      </div>
    </>
  );
}

export default AboutManager;
