import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

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

export default ResourceManager;
