import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/api";

const SECTIONS = [
  { value: "projects", label: "Projects" },
  { value: "skills", label: "Skills" },
  { value: "experience", label: "Experience" },
  { value: "education", label: "Education" },
  { value: "about", label: "About Me" },
  { value: "settings", label: "Website Settings" },
];

const PERMISSION_FIELDS = [
  ["canView", "View"],
  ["canCreate", "Create"],
  ["canEdit", "Edit"],
  ["canDelete", "Delete"],
];

const EMPTY_PERMISSION = { canView: false, canCreate: false, canEdit: false, canDelete: false };

function AdminGovernance({ mode, currentUser }) {
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [permissions, setPermissions] = useState({});
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [requestType, setRequestType] = useState("PERMISSION");
  const [requestSection, setRequestSection] = useState("projects");
  const [requestAction, setRequestAction] = useState("CREATE");
  const [requestTargetId, setRequestTargetId] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [payloadText, setPayloadText] = useState("{}");
  const [requestedPermissions, setRequestedPermissions] = useState({ ...EMPTY_PERMISSION });

  const selectedAdmin = useMemo(
    () => admins.find((admin) => admin.id === selectedAdminId) || null,
    [admins, selectedAdminId]
  );

  async function loadAdmins() {
    const result = await apiRequest("/auth/admins");
    const list = result.admins || [];
    setAdmins(list);
    if (!selectedAdminId) {
      setSelectedAdminId(list.find((admin) => admin.role === "ADMIN")?.id || "");
    }
    return list;
  }

  async function loadRequests() {
    const result = await apiRequest("/auth/requests");
    setRequests(result.requests || []);
  }

  async function loadLogs() {
    const result = await apiRequest("/auth/audit-logs?limit=100");
    setLogs(result.logs || []);
  }

  async function loadPage() {
    setLoading(true);
    setError("");
    try {
      if (mode === "permissions") {
        await loadAdmins();
      } else if (mode === "requests") {
        await loadRequests();
      } else if (mode === "history") {
        await loadLogs();
      }
    } catch (err) {
      setError(err.message || "Could not load this workspace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, [mode]);

  useEffect(() => {
    if (!selectedAdmin) {
      setPermissions({});
      return;
    }
    const next = {};
    for (const section of SECTIONS) {
      next[section.value] = { ...EMPTY_PERMISSION };
    }
    for (const item of selectedAdmin.permissions || []) {
      if (next[item.section]) {
        next[item.section] = {
          canView: Boolean(item.canView),
          canCreate: Boolean(item.canCreate),
          canEdit: Boolean(item.canEdit),
          canDelete: Boolean(item.canDelete),
        };
      }
    }
    setPermissions(next);
  }, [selectedAdminId, admins]);

  function updatePermission(section, field, checked) {
    setPermissions((previous) => ({
      ...previous,
      [section]: {
        ...(previous[section] || EMPTY_PERMISSION),
        [field]: checked,
        ...(["canCreate", "canEdit", "canDelete"].includes(field) && checked ? { canView: true } : {}),
        ...(field === "canView" && !checked
          ? { canCreate: false, canEdit: false, canDelete: false }
          : {}),
      },
    }));
  }

  async function savePermissions() {
    if (!selectedAdminId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const permissionRows = SECTIONS.map((section) => ({
        section: section.value,
        ...(permissions[section.value] || EMPTY_PERMISSION),
      }));
      await apiRequest(`/auth/admins/${selectedAdminId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions: permissionRows }),
      });
      setNotice("Admin permissions saved successfully.");
      await loadAdmins();
    } catch (err) {
      setError(err.message || "Could not save permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function submitRequest(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      let payload;
      if (requestType === "DATA_CHANGE" && requestAction !== "DELETE") {
        try {
          payload = JSON.parse(payloadText);
        } catch {
          throw new Error("Proposed data must be valid JSON.");
        }
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
          throw new Error("Proposed data must be a JSON object.");
        }
      }

      const body = {
        requestType,
        section: requestSection,
        title: requestTitle,
        message: requestMessage,
        ...(requestType === "PERMISSION"
          ? { requestedPermissions }
          : {
              action: requestAction,
              ...(requestAction !== "CREATE" ? { targetId: requestTargetId } : {}),
              ...(requestAction !== "DELETE" ? { payload } : {}),
            }),
      };

      await apiRequest("/auth/requests", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setNotice("Your request has been sent to the Super Admin.");
      setRequestTitle("");
      setRequestMessage("");
      setRequestTargetId("");
      setPayloadText("{}");
      await loadRequests();
    } catch (err) {
      setError(err.message || "Could not submit your request.");
    } finally {
      setSaving(false);
    }
  }

  async function reviewRequest(request, status) {
    const note = window.prompt(
      status === "APPROVED" ? "Optional approval note:" : "Reason for rejection (recommended):",
      ""
    );
    if (note === null) return;

    setError("");
    setNotice("");
    try {
      await apiRequest(`/auth/requests/${request.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status, reviewNote: note }),
      });
      setNotice(`Request ${status.toLowerCase()} successfully.`);
      await loadRequests();
    } catch (err) {
      setError(err.message || "Could not review this request.");
    }
  }

  if (loading) return <div className="admin-panel"><p>Loading governance workspace...</p></div>;

  return (
    <>
      <div className="admin-heading">
        <h1>
          {mode === "permissions" ? "Permission & Job Control" :
            mode === "requests" ? "Requests & Approvals" : "Activity & Audit History"}
        </h1>
        <p>
          {mode === "permissions"
            ? "Choose exactly what each regular Admin can view, create, edit, and delete."
            : mode === "requests"
              ? isSuperAdmin
                ? "Review permission and data-change requests from your Admin team."
                : "Request access to another section or ask for a specific data change."
              : "Review the recorded changes made across the Admin workspace."}
        </p>
      </div>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {notice && <div className="admin-notice" role="status">{notice}</div>}

      {mode === "permissions" && isSuperAdmin && (
        <>
          <div className="admin-panel">
            <div className="admin-form">
              <div>
                <label htmlFor="permission-admin">Select Admin</label>
                <select id="permission-admin" value={selectedAdminId} onChange={(event) => setSelectedAdminId(event.target.value)}>
                  <option value="">Choose an Admin</option>
                  {admins.filter((admin) => admin.role === "ADMIN").map((admin) => (
                    <option value={admin.id} key={admin.id}>{admin.name} — {admin.email}</option>
                  ))}
                </select>
              </div>
            </div>
            {!selectedAdmin && <p className="admin-help">Create a regular Admin account first. Super Admin permissions are always unrestricted.</p>}
          </div>

          {selectedAdmin && (
            <div className="admin-panel">
              <div className="admin-admin-list-heading">
                <h2>Section Permissions</h2>
                <span>{selectedAdmin.name}</span>
              </div>
              <p className="admin-help">Create, Edit, and Delete automatically require View. Changes take effect on the next protected API request.</p>
              <div className="admin-list">
                {SECTIONS.map((section) => (
                  <div className="admin-item" key={section.value}>
                    <div>
                      <h3>{section.label}</h3>
                      <p>Access controls for {section.label.toLowerCase()}.</p>
                    </div>
                    <div className="admin-permission-grid">
                      {PERMISSION_FIELDS.map(([field, label]) => (
                        <label key={field}>
                          <input
                            type="checkbox"
                            checked={Boolean(permissions[section.value]?.[field])}
                            onChange={(event) => updatePermission(section.value, field, event.target.checked)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="admin-primary" disabled={saving} onClick={savePermissions}>
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          )}
        </>
      )}

      {mode === "requests" && (
        <>
          {!isSuperAdmin && (
            <div className="admin-panel">
              <h2>Submit a Request</h2>
              <form className="admin-form" onSubmit={submitRequest}>
                <div>
                  <label htmlFor="request-type">Request Type</label>
                  <select id="request-type" value={requestType} onChange={(event) => setRequestType(event.target.value)}>
                    <option value="PERMISSION">Request Section Permission</option>
                    <option value="DATA_CHANGE">Request Data Entry / Change</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="request-section">Section</label>
                  <select id="request-section" value={requestSection} onChange={(event) => setRequestSection(event.target.value)}>
                    {SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                  </select>
                </div>

                {requestType === "PERMISSION" ? (
                  <div className="full-width">
                    <label>Requested Access</label>
                    <div className="admin-permission-grid">
                      {PERMISSION_FIELDS.map(([field, label]) => (
                        <label key={field}>
                          <input
                            type="checkbox"
                            checked={Boolean(requestedPermissions[field])}
                            onChange={(event) => setRequestedPermissions((old) => ({
                              ...old,
                              [field]: event.target.checked,
                              ...(["canCreate", "canEdit", "canDelete"].includes(field) && event.target.checked ? { canView: true } : {}),
                              ...(field === "canView" && !event.target.checked ? { canCreate: false, canEdit: false, canDelete: false } : {}),
                            }))}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="request-action">Requested Action</label>
                      <select id="request-action" value={requestAction} onChange={(event) => setRequestAction(event.target.value)}>
                        <option value="CREATE">Create New Record</option>
                        <option value="UPDATE">Update Existing Record</option>
                        <option value="DELETE">Delete Existing Record</option>
                      </select>
                    </div>
                    {requestAction !== "CREATE" && (
                      <div>
                        <label htmlFor="request-record-id">Record ID</label>
                        <input id="request-record-id" value={requestTargetId} onChange={(event) => setRequestTargetId(event.target.value)} required />
                      </div>
                    )}
                    {requestAction !== "DELETE" && (
                      <div className="full-width">
                        <label htmlFor="request-payload">Proposed Data (JSON)</label>
                        <textarea id="request-payload" rows={8} value={payloadText} onChange={(event) => setPayloadText(event.target.value)} spellCheck="false" />
                        <p className="admin-help">Only fields supported by the selected section are applied. Do not include passwords, tokens, private client data, or Base64 images.</p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label htmlFor="request-title">Request Title</label>
                  <input id="request-title" value={requestTitle} onChange={(event) => setRequestTitle(event.target.value)} maxLength={120} required />
                </div>
                <div className="full-width">
                  <label htmlFor="request-message">Reason / Details</label>
                  <textarea id="request-message" rows={3} value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} maxLength={3000} required />
                </div>
                <div className="full-width">
                  <button className="admin-primary" disabled={saving}>{saving ? "Submitting..." : "Submit Request"}</button>
                </div>
              </form>
            </div>
          )}

          <div className="admin-panel">
            <div className="admin-admin-list-heading">
              <h2>{isSuperAdmin ? "All Admin Requests" : "My Requests"}</h2>
              <span>{requests.length} total</span>
            </div>
            {requests.length === 0 ? <p>No requests found.</p> : (
              <div className="admin-list">
                {requests.map((request) => (
                  <article className="admin-item admin-governance-request" key={request.id}>
                    <div>
                      <div className="admin-admin-name">
                        <h3>{request.title}</h3>
                        <span className={`admin-request-status ${request.status.toLowerCase()}`}>{request.status}</span>
                      </div>
                      <p>{request.requester?.name || "Admin"} · {request.requestType.replace("_", " ")} · {request.section}</p>
                      <p>{request.message}</p>
                      {request.requestType === "PERMISSION" && request.requestedPermissions && (
                        <p>Requested: {PERMISSION_FIELDS.filter(([field]) => request.requestedPermissions[field]).map(([, label]) => label).join(", ") || "No access"}</p>
                      )}
                      {request.requestType === "DATA_CHANGE" && (
                        <details><summary>View proposed data</summary><pre className="admin-code-preview">{JSON.stringify(request.payload, null, 2)}</pre></details>
                      )}
                      {request.reviewNote && <p className="admin-help">Review note: {request.reviewNote}</p>}
                      <span className="admin-admin-date">{new Date(request.createdAt).toLocaleString()}</span>
                    </div>
                    {isSuperAdmin && request.status === "PENDING" && (
                      <div className="admin-actions">
                        <button type="button" onClick={() => reviewRequest(request, "APPROVED")}>Approve</button>
                        <button type="button" onClick={() => reviewRequest(request, "REJECTED")}>Reject</button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {mode === "history" && isSuperAdmin && (
        <div className="admin-panel">
          <div className="admin-admin-list-heading">
            <h2>Recent Activity</h2>
            <span>Latest {logs.length}</span>
          </div>
          {logs.length === 0 ? <p>No activity has been recorded yet.</p> : (
            <div className="admin-list">
              {logs.map((log) => (
                <article className="admin-item admin-audit-item" key={log.id}>
                  <div>
                    <div className="admin-admin-name">
                      <h3>{log.summary}</h3>
                      <span className="admin-role-label">{log.action}</span>
                    </div>
                    <p>{log.actorName} · {log.actorEmail} · {log.section}</p>
                    <span className="admin-admin-date">{new Date(log.createdAt).toLocaleString()}</span>
                    {(log.before || log.after) && (
                      <details>
                        <summary>View change details</summary>
                        <div className="admin-audit-snapshots">
                          {log.before && <div><strong>Before</strong><pre className="admin-code-preview">{JSON.stringify(log.before, null, 2)}</pre></div>}
                          {log.after && <div><strong>After</strong><pre className="admin-code-preview">{JSON.stringify(log.after, null, 2)}</pre></div>}
                        </div>
                      </details>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default AdminGovernance;
