import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { api } from "./api.js";

// Fix Leaflet's default marker URLs when bundled by Vite.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

const blankReport = {
  title: "", category: "Medical", description: "", severity: "MEDIUM",
  latitude: "", longitude: "", locationText: ""
};

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("resqnow_user")); } catch { return null; }
  });
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ fullName: "", email: "", password: "", role: "CITIZEN" });
  const [incidents, setIncidents] = useState([]);
  const [report, setReport] = useState(blankReport);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("dashboard");

  async function loadIncidents() {
    try {
      const { data } = await api.get("/incidents");
      setIncidents(data.incidents);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load incidents. Is the backend running?");
    }
  }

  useEffect(() => {
    if (user) loadIncidents();
  }, [user]);

  async function submitAuth(e) {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload = authMode === "login"
        ? { email: auth.email, password: auth.password }
        : auth;
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem("resqnow_token", data.token);
      localStorage.setItem("resqnow_user", JSON.stringify(data.user));
      setUser(data.user); setMessage("Welcome to ResQNow."); setView("dashboard");
    } catch (e) {
      setError(e.response?.data?.message || "Authentication failed.");
    } finally { setLoading(false); }
  }

  function logout() {
    localStorage.removeItem("resqnow_token");
    localStorage.removeItem("resqnow_user");
    setUser(null); setIncidents([]); setMessage(""); setError("");
  }

  function locateMe() {
    setError(""); setMessage("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported. Enter coordinates manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setReport((r) => ({
        ...r, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6)
      })),
      () => setError("Location permission was unavailable. Enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submitReport(e) {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      await api.post("/incidents", {
        ...report, latitude: Number(report.latitude), longitude: Number(report.longitude)
      });
      setReport(blankReport); setMessage("Emergency report submitted successfully.");
      await loadIncidents(); setView("dashboard");
    } catch (e) {
      setError(e.response?.data?.message || "Could not submit report.");
    } finally { setLoading(false); }
  }

  async function acceptIncident(id) {
    setError(""); setMessage("");
    try {
      await api.post(`/incidents/${id}/accept`);
      setMessage("Incident accepted. You are now assigned to this task.");
      await loadIncidents();
    } catch (e) {
      setError(e.response?.data?.message || "Could not accept incident.");
    }
  }

  async function updateStatus(id, status) {
    setError(""); setMessage("");
    try {
      await api.patch(`/incidents/${id}/status`, { status });
      setMessage(`Incident status updated to ${status.replaceAll("_", " ")}.`);
      await loadIncidents();
    } catch (e) {
      setError(e.response?.data?.message || "Could not update status.");
    }
  }

  async function toggleAvailability(available) {
    try {
      await api.patch("/incidents/availability", { available });
      const updated = { ...user, availability: available };
      setUser(updated); localStorage.setItem("resqnow_user", JSON.stringify(updated));
      setMessage(`You are now ${available ? "available" : "unavailable"}.`);
    } catch (e) {
      setError(e.response?.data?.message || "Could not update availability.");
    }
  }

  const stats = useMemo(() => ({
    total: incidents.length,
    active: incidents.filter((i) => !["RESOLVED", "CANCELLED"].includes(i.status)).length,
    resolved: incidents.filter((i) => i.status === "RESOLVED").length
  }), [incidents]);

  if (!user) {
    return <main className="auth-shell">
      <section className="auth-hero">
        <div className="brand-mark">R</div>
        <p className="eyebrow">COMMUNITY-POWERED EMERGENCY SUPPORT</p>
        <h1>Help should never have to wait.</h1>
        <p className="hero-copy">Report incidents, coordinate nearby responders, and follow every update in one place.</p>
        <div className="safety-note"><strong>Academic prototype</strong><br />This website does not contact official emergency services.</div>
      </section>
      <section className="auth-card">
        <p className="eyebrow">RESQNOW PLATFORM</p>
        <h2>{authMode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="muted">Sign in or create an account to get started.</p>
        <form onSubmit={submitAuth} className="form-stack">
          {authMode === "register" && <>
            <label>Full name<input required value={auth.fullName} onChange={(e) => setAuth({ ...auth, fullName: e.target.value })} placeholder="Your full name" /></label>
            <label>Account type<select value={auth.role} onChange={(e) => setAuth({ ...auth, role: e.target.value })}><option value="CITIZEN">Citizen</option><option value="RESPONDER">Volunteer / Responder</option></select></label>
          </>}
          <label>Email address<input type="email" required value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com" /></label>
          <label>Password<input type="password" required minLength="8" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} placeholder="At least 8 characters" /></label>
          {error && <p className="alert error">{error}</p>}
          {message && <p className="alert success">{message}</p>}
          <button className="primary-btn" disabled={loading}>{loading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <p className="switch-auth">{authMode === "login" ? "New to ResQNow?" : "Already registered?"} <button className="text-btn" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>{authMode === "login" ? "Create an account" : "Sign in"}</button></p>
      </section>
    </main>;
  }

  const canReport = ["CITIZEN", "ADMIN"].includes(user.role);
  const isResponder = ["RESPONDER", "ADMIN"].includes(user.role);
  const visibleIncidents = incidents;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark small">R</span><span>ResQNow<small>RESPONSE NETWORK</small></span></div>
      <div className="side-label">WORKSPACE</div>
      <button className={view === "dashboard" ? "nav-item active" : "nav-item"} onClick={() => setView("dashboard")}>▦ <span>Dashboard</span></button>
      {canReport && <button className={view === "report" ? "nav-item active" : "nav-item"} onClick={() => setView("report")}>＋ <span>Report emergency</span></button>}
      <button className={view === "map" ? "nav-item active" : "nav-item"} onClick={() => setView("map")}>⌖ <span>Incident map</span></button>
      <div className="sidebar-bottom">
        <div className="profile-mini"><div className="avatar">{user.fullName?.[0]?.toUpperCase()}</div><div><strong>{user.fullName}</strong><small>{user.role}</small></div></div>
        <button className="nav-item" onClick={logout}>↪ <span>Sign out</span></button>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">EMERGENCY OPERATIONS</p><h1>{view === "report" ? "Report an emergency" : view === "map" ? "Live incident map" : "Response dashboard"}</h1></div><div className="top-user"><span className="online-dot"></span><span>{user.fullName}</span><span className="role-pill">{user.role}</span></div></header>
      {error && <p className="alert error">{error}</p>}
      {message && <p className="alert success">{message}</p>}

      {view === "report" && canReport && <section className="panel report-panel">
        <div className="panel-heading"><div><h2>Emergency details</h2><p className="muted">Share accurate information so responders can understand the situation.</p></div><span className="required-label">* Required fields</span></div>
        <form onSubmit={submitReport} className="report-grid">
          <label>Incident title *<input required maxLength="100" value={report.title} onChange={(e) => setReport({ ...report, title: e.target.value })} placeholder="e.g. Road accident near main road" /></label>
          <label>Category *<select value={report.category} onChange={(e) => setReport({ ...report, category: e.target.value })}>{["Medical", "Road Accident", "Fire", "Flood", "Missing Person", "Other"].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Severity<select value={report.severity} onChange={(e) => setReport({ ...report, severity: e.target.value })}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></label>
          <label>Location description<input value={report.locationText} onChange={(e) => setReport({ ...report, locationText: e.target.value })} placeholder="Street, landmark, or area" /></label>
          <label className="wide">Description *<textarea required rows="4" maxLength="2000" value={report.description} onChange={(e) => setReport({ ...report, description: e.target.value })} placeholder="Describe what happened and any immediate risks..." /></label>
          <div className="location-box wide"><div><strong>Incident coordinates</strong><p className="muted">Allow location access or enter coordinates manually.</p></div><button type="button" className="secondary-btn" onClick={locateMe}>Use my location</button></div>
          <label>Latitude *<input type="number" required step="any" min="-90" max="90" value={report.latitude} onChange={(e) => setReport({ ...report, latitude: e.target.value })} placeholder="17.3850" /></label>
          <label>Longitude *<input type="number" required step="any" min="-180" max="180" value={report.longitude} onChange={(e) => setReport({ ...report, longitude: e.target.value })} placeholder="78.4867" /></label>
          <div className="wide"><button className="primary-btn" disabled={loading}>{loading ? "Submitting..." : "Submit emergency report"}</button></div>
        </form>
      </section>}

      {view !== "report" && <>
        <section className="stat-grid">
          <Stat label="Incidents shown" value={stats.total} note="Based on your access" icon="▤" />
          <Stat label="Active incidents" value={stats.active} note="Require follow-up" icon="◉" />
          <Stat label="Resolved" value={stats.resolved} note="Marked resolved" icon="✓" />
          {user.role === "RESPONDER" && <div className="stat-card availability"><span className="stat-icon">◌</span><p>Responder availability</p><strong>{user.availability ? "Available" : "Unavailable"}</strong><button className="secondary-btn" onClick={() => toggleAvailability(!user.availability)}>{user.availability ? "Go unavailable" : "Go available"}</button></div>}
        </section>
        {view === "map" && <section className="panel map-panel"><div className="panel-heading"><div><h2>Incident locations</h2><p className="muted">Only incidents visible to your account are shown.</p></div></div><IncidentMap incidents={visibleIncidents} /></section>}
        <section className="panel">
          <div className="panel-heading"><div><h2>{user.role === "CITIZEN" ? "My incident reports" : user.role === "ADMIN" ? "All visible incidents" : "Available rescue tasks"}</h2><p className="muted">Status and response information for reported incidents.</p></div><button className="secondary-btn" onClick={loadIncidents}>Refresh</button></div>
          {visibleIncidents.length === 0 ? <div className="empty-state"><div className="empty-icon">✓</div><h3>No incidents to display</h3><p>New reports will appear here when submitted.</p>{canReport && <button className="primary-btn" onClick={() => setView("report")}>Report an emergency</button>}</div> :
            <div className="incident-list">{visibleIncidents.map((incident) => <IncidentCard key={incident.id} incident={incident} user={user} onAccept={acceptIncident} onStatus={updateStatus} />)}</div>}
        </section>
      </>}
      <footer className="footer-note">ResQNow academic prototype · Not a replacement for official emergency services</footer>
    </main>
  </div>;
}

function Stat({ label, value, note, icon }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><p>{label}</p><strong>{value}</strong><small>{note}</small></div>;
}

function IncidentCard({ incident, user, onAccept, onStatus }) {
  const severityClass = incident.severity.toLowerCase();
  const assignedToMe = incident.assignedResponderId === user.id;
  const responseMinutes = incident.acceptedAt
    ? Math.max(0, Math.round((new Date(incident.acceptedAt) - new Date(incident.createdAt)) / 60000))
    : null;
  return <article className="incident-card">
    <div className="incident-main">
      <div className="incident-title-row"><h3>{incident.title}</h3><span className={`severity ${severityClass}`}>{incident.severity}</span></div>
      <p className="incident-desc">{incident.description}</p>
      <div className="incident-meta"><span>▦ {incident.category}</span><span>⌖ {incident.locationText || `${Number(incident.latitude).toFixed(4)}, ${Number(incident.longitude).toFixed(4)}`}</span><span>◷ {formatDate(incident.createdAt)}</span></div>
      <div className="incident-meta"><span>Reported by: {incident.reporter?.fullName || "User"}</span>{incident.assignedResponder && <span>Responder: {incident.assignedResponder.fullName}</span>}{responseMinutes !== null && <span>Accepted in {responseMinutes} min</span>}</div>
    </div>
    <div className="incident-actions"><span className={`status ${incident.status.toLowerCase()}`}>{incident.status.replaceAll("_", " ")}</span>
      {user.role === "RESPONDER" && incident.status === "OPEN" && <button className="primary-btn compact" onClick={() => onAccept(incident.id)}>Accept task</button>}
      {user.role === "RESPONDER" && assignedToMe && incident.status === "ACCEPTED" && <button className="secondary-btn compact" onClick={() => onStatus(incident.id, "EN_ROUTE")}>Mark en route</button>}
      {user.role === "RESPONDER" && assignedToMe && incident.status === "EN_ROUTE" && <button className="secondary-btn compact" onClick={() => onStatus(incident.id, "ON_SCENE")}>Mark on scene</button>}
      {user.role === "RESPONDER" && assignedToMe && incident.status === "ON_SCENE" && <button className="primary-btn compact" onClick={() => onStatus(incident.id, "RESOLVED")}>Resolve task</button>}
      {user.role === "ADMIN" && !["RESOLVED", "CANCELLED"].includes(incident.status) && <button className="primary-btn compact" onClick={() => onStatus(incident.id, "RESOLVED")}>Mark resolved</button>}
    </div>
  </article>;
}

function IncidentMap({ incidents }) {
  const center = incidents.length ? [incidents[0].latitude, incidents[0].longitude] : [17.385, 78.4867];
  return <MapContainer center={center} zoom={incidents.length ? 12 : 5} scrollWheelZoom className="leaflet-map">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {incidents.map((i) => <Marker key={i.id} position={[i.latitude, i.longitude]}><Popup><strong>{i.title}</strong><br />{i.category} · {i.severity}<br />Status: {i.status.replaceAll("_", " ")}<br />{i.locationText || "Location provided by coordinates"}</Popup></Marker>)}
  </MapContainer>;
}
