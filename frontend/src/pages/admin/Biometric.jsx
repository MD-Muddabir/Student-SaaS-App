/**
 * Biometric Attendance Management — Admin Page
 * Phases 2, 3, 5, 7, 8, 10: Devices, Enrollment, Live Attendance,
 * OTP/QR Attendance, Reports, Settings
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

// ─── Tab IDs ─────────────────────────────────────────────────────
const TABS = [
    { id: "live", label: "📡 Live Attendance" },
    { id: "devices", label: "🖥️ Devices" },
    { id: "enrollment", label: "🧬 Enrollment" },
    { id: "otp", label: "📱 OTP/QR" },
    { id: "reports", label: "📊 Reports" },
    { id: "settings", label: "⚙️ Settings" },
];

export default function BiometricPage() {
    const [activeTab, setActiveTab] = useState("live");

    return (
        <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                    🔐 Biometric Attendance
                </h1>
                <p style={{ color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>
                    Manage devices, enrollments, and view live attendance data
                </p>
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "1.5rem",
                    flexWrap: "wrap",
                    borderBottom: "2px solid var(--border-color)",
                    paddingBottom: "0",
                }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "0.6rem 1.2rem",
                            borderRadius: "8px 8px 0 0",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            background:
                                activeTab === tab.id
                                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                    : "transparent",
                            color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
                            transition: "all 0.2s",
                            fontSize: "0.88rem",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "live" && <LiveAttendanceTab />}
            {activeTab === "devices" && <DevicesTab />}
            {activeTab === "enrollment" && <EnrollmentTab />}
            {activeTab === "otp" && <OtpQrTab />}
            {activeTab === "reports" && <ReportsTab />}
            {activeTab === "settings" && <SettingsTab />}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// LIVE ATTENDANCE TAB  (Phase 7 + 8)
// ─────────────────────────────────────────────────────────────────
function LiveAttendanceTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef(null);

    const fetchLive = async () => {
        try {
            const res = await api.get("/biometric/live");
            if (res.data.success) setData(res.data.data);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLive();
        intervalRef.current = setInterval(fetchLive, 15000); // Poll every 15s
        return () => clearInterval(intervalRef.current);
    }, []);

    if (loading) return <LoadingCard />;

    const records = data?.records || [];

    return (
        <div>
            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                <StatBox icon="📡" label="Today's Date" value={data?.date || "—"} color="#6366f1" />
                <StatBox icon="✅" label="Present" value={data?.total_marked || 0} color="#10b981" />
                <StatBox icon="⚠️" label="Late Arrivals" value={data?.late || 0} color="#f59e0b" />
                <StatBox icon="🔄" label="Auto-refresh" value="15s" color="#8b5cf6" />
            </div>

            {/* Records Table */}
            <div className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ margin: 0 }}>📋 Today's Biometric Punches</h3>
                    <button
                        onClick={fetchLive}
                        style={{ padding: "0.4rem 1rem", borderRadius: "8px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
                    >
                        🔄 Refresh
                    </button>
                </div>
                {records.length === 0 ? (
                    <Empty msg="No biometric punches recorded today" />
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                            <thead>
                                <tr style={{ background: "var(--table-header, rgba(99,102,241,0.1))" }}>
                                    {["Student", "Class", "Time In", "Status", "Late By"].map((h) => (
                                        <th key={h} style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                        <td style={{ padding: "0.7rem" }}>{r.name || "—"}</td>
                                        <td style={{ padding: "0.7rem" }}>{r.class || "—"}</td>
                                        <td style={{ padding: "0.7rem" }}>{r.time_in || "—"}</td>
                                        <td style={{ padding: "0.7rem" }}>
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td style={{ padding: "0.7rem" }}>
                                            {r.is_late ? <span style={{ color: "#f59e0b", fontWeight: 600 }}>{r.late_by_minutes} min</span> : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// DEVICES TAB  (Phase 2)
// ─────────────────────────────────────────────────────────────────
function DevicesTab() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editDevice, setEditDevice] = useState(null);
    const [form, setForm] = useState({
        device_name: "", device_serial: "", device_type: "fingerprint",
        location: "", ip_address: "",
    });

    const fetchDevices = async () => {
        try {
            const res = await api.get("/biometric/devices");
            if (res.data.success) setDevices(res.data.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchDevices(); }, []);

    const openAdd = () => {
        setEditDevice(null);
        setForm({ device_name: "", device_serial: "", device_type: "fingerprint", location: "", ip_address: "" });
        setShowForm(true);
    };

    const openEdit = (d) => {
        setEditDevice(d);
        setForm({ device_name: d.device_name, device_serial: d.device_serial, device_type: d.device_type, location: d.location || "", ip_address: d.ip_address || "" });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.device_name || !form.device_serial) {
            toast.error("Device name and serial are required");
            return;
        }
        try {
            if (editDevice) {
                await api.put(`/biometric/devices/${editDevice.id}`, form);
                toast.success("Device updated");
            } else {
                const res = await api.post("/biometric/devices", form);
                toast.success("Device registered! Secret key: " + res.data.data.secret_key);
            }
            setShowForm(false);
            fetchDevices();
        } catch (err) {
            toast.error(err.response?.data?.message || "Error saving device");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Remove this device? All enrollments on it will stop working.")) return;
        try {
            await api.delete(`/biometric/devices/${id}`);
            toast.success("Device removed");
            fetchDevices();
        } catch { toast.error("Error"); }
    };

    const handleSync = async (id) => {
        try {
            await api.post(`/biometric/devices/${id}/sync`);
            toast.success("Sync triggered");
        } catch { toast.error("Sync failed"); }
    };

    if (loading) return <LoadingCard />;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>🖥️ Registered Devices</h3>
                <button onClick={openAdd} style={btnStyle("#6366f1")}>+ Add Device</button>
            </div>

            {devices.length === 0 ? (
                <Empty msg="No biometric devices registered yet" />
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                    {devices.map((d) => {
                        const lastSync = d.last_sync ? new Date(d.last_sync) : null;
                        const diffMins = lastSync ? Math.floor((Date.now() - lastSync.getTime()) / 60000) : null;
                        const isOnline = lastSync && diffMins < 15;
                        return (
                            <div key={d.id} className="card" style={{ padding: "1.25rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem" }}>{d.device_name}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{d.location || "No location"}</div>
                                    </div>
                                    <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: isOnline ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: isOnline ? "#10b981" : "#ef4444" }}>
                                        {isOnline ? "🟢 Online" : "🔴 Offline"}
                                    </span>
                                </div>
                                <div style={{ fontSize: "0.83rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                    <div>Serial: <strong>{d.device_serial}</strong></div>
                                    <div>Type: {d.device_type} | IP: {d.ip_address || "—"}</div>
                                    <div>Last sync: {lastSync ? `${diffMins}m ago` : "Never"}</div>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button onClick={() => openEdit(d)} style={btnSmall("#6366f1")}>✏️ Edit</button>
                                    <button onClick={() => handleSync(d.id)} style={btnSmall("#10b981")}>🔄 Sync</button>
                                    <button onClick={() => handleDelete(d.id)} style={btnSmall("#ef4444")}>🗑️ Remove</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <Modal title={editDevice ? "Edit Device" : "Register New Device"} onClose={() => setShowForm(false)}>
                    <FormField label="Device Name *" value={form.device_name} onChange={(v) => setForm({ ...form, device_name: v })} placeholder="e.g. Gate-1 Fingerprint" />
                    <FormField label="Device Serial *" value={form.device_serial} onChange={(v) => setForm({ ...form, device_serial: v })} placeholder="e.g. CDK9191960001" disabled={!!editDevice} />
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", display: "block" }}>Device Type</label>
                        <select value={form.device_type} onChange={(e) => setForm({ ...form, device_type: e.target.value })} style={inputStyle}>
                            <option value="fingerprint">Fingerprint</option>
                            <option value="face">Face Recognition</option>
                            <option value="rfid">RFID Card</option>
                            <option value="mobile">Mobile OTP</option>
                        </select>
                    </div>
                    <FormField label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="e.g. Main Gate" />
                    <FormField label="IP Address" value={form.ip_address} onChange={(v) => setForm({ ...form, ip_address: v })} placeholder="e.g. 192.168.1.100" />
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                        <button onClick={() => setShowForm(false)} style={btnSmall("#6b7280")}>Cancel</button>
                        <button onClick={handleSave} style={btnStyle("#6366f1")}>{editDevice ? "Update" : "Register"}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// ENROLLMENT TAB  (Phase 3)
// ─────────────────────────────────────────────────────────────────
function EnrollmentTab() {
    const [enrollments, setEnrollments] = useState([]);
    const [devices, setDevices] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ device_id: "", device_user_id: "", user_id: "", user_role: "student" });
    const [searchQuery, setSearchQuery] = useState("");

    const fetchAll = async () => {
        try {
            const [e, d, s, f] = await Promise.all([
                api.get("/biometric/enrollments"),
                api.get("/biometric/devices"),
                api.get("/students"),
                api.get("/faculty"),
            ]);
            if (e.data.success) setEnrollments(e.data.data);
            if (d.data.success) setDevices(d.data.data);
            // Combine students and faculty for user dropdown
            const studentUsers = (s.data.data || []).map((st) => ({
                id: st.user_id, name: st.User?.name, role: "student", rollNo: st.roll_number
            }));
            const facultyUsers = (f.data.data || []).map((fac) => ({
                id: fac.user_id, name: fac.User?.name, role: "faculty", subject: fac.subject
            }));
            setUsers([...studentUsers, ...facultyUsers]);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleEnroll = async () => {
        if (!form.device_id || !form.device_user_id || !form.user_id) {
            toast.error("All fields are required");
            return;
        }
        try {
            await api.post("/biometric/enroll", form);
            toast.success("Enrolled successfully");
            setShowForm(false);
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || "Enrollment failed");
        }
    };

    const handleRemove = async (id) => {
        if (!confirm("Deactivate this enrollment?")) return;
        try {
            await api.delete(`/biometric/enrollments/${id}`);
            toast.success("Enrollment deactivated");
            fetchAll();
        } catch { toast.error("Error"); }
    };

    const filtered = enrollments.filter((e) => {
        const name = e.User?.name?.toLowerCase() || "";
        return name.includes(searchQuery.toLowerCase());
    });

    if (loading) return <LoadingCard />;

    const filteredUsers = form.user_role === "student"
        ? users.filter((u) => u.role === "student")
        : users.filter((u) => u.role === "faculty");

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>🧬 Biometric Enrollments</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name..." style={{ ...inputStyle, width: "200px" }} />
                    <button onClick={() => setShowForm(true)} style={btnStyle("#6366f1")}>+ Enroll Person</button>
                </div>
            </div>

            {/* Enrollment guide */}
            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <strong>How enrollment works:</strong> Admin assigns fingerprint on device → notes the Device User ID shown → enters it here to link it to a student/faculty account.
            </div>

            {filtered.length === 0 ? (
                <Empty msg="No enrollments found" />
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                        <thead>
                            <tr style={{ background: "var(--table-header, rgba(99,102,241,0.1))" }}>
                                {["Name", "Role", "Device", "Device User ID", "Enrolled At", "Status", "Action"].map((h) => (
                                    <th key={h} style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((e) => (
                                <tr key={e.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    <td style={{ padding: "0.7rem" }}>{e.User?.name || "—"}</td>
                                    <td style={{ padding: "0.7rem" }}>{e.user_role}</td>
                                    <td style={{ padding: "0.7rem" }}>{e.BiometricDevice?.device_name || "—"}</td>
                                    <td style={{ padding: "0.7rem", fontFamily: "monospace" }}>{e.device_user_id}</td>
                                    <td style={{ padding: "0.7rem" }}>{new Date(e.enrolled_at || e.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: "0.7rem" }}>
                                        <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: e.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: e.status === "active" ? "#10b981" : "#ef4444" }}>
                                            {e.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "0.7rem" }}>
                                        {e.status === "active" && (
                                            <button onClick={() => handleRemove(e.id)} style={btnSmall("#ef4444")}>Deactivate</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <Modal title="Enroll Person on Device" onClose={() => setShowForm(false)}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", display: "block" }}>Device *</label>
                        <select value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} style={inputStyle}>
                            <option value="">Select device...</option>
                            {devices.map((d) => <option key={d.id} value={d.id}>{d.device_name} ({d.location})</option>)}
                        </select>
                    </div>
                    <FormField label="Device User ID *" value={form.device_user_id} onChange={(v) => setForm({ ...form, device_user_id: v })} placeholder="ID shown on device after fingerprint enroll" />
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", display: "block" }}>Role</label>
                        <select value={form.user_role} onChange={(e) => setForm({ ...form, user_role: e.target.value, user_id: "" })} style={inputStyle}>
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", display: "block" }}>Person *</label>
                        <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} style={inputStyle}>
                            <option value="">Select person...</option>
                            {filteredUsers.map((u) => <option key={u.id} value={u.id}>{u.name} {u.rollNo ? `(${u.rollNo})` : ""}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                        <button onClick={() => setShowForm(false)} style={btnSmall("#6b7280")}>Cancel</button>
                        <button onClick={handleEnroll} style={btnStyle("#6366f1")}>Enroll</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// OTP / QR TAB  (Smart QR Attendance — Faculty scans student QR)
// ─────────────────────────────────────────────────────────────────
function OtpQrTab() {
    const navigate = useNavigate();
    return (
        <div>
            <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.25rem" }}>
                <h3 style={{ margin: "0 0 0.5rem" }}>📸 Smart QR Attendance System</h3>
                <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem", lineHeight: 1.6 }}>
                    Each student receives a <strong>unique permanent QR Code</strong> upon subject enrollment.
                    Faculty scans the student's QR Code to instantly mark attendance —{" "}
                    <strong>no OTP, no student action required.</strong>
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                <InfoCard
                    icon="🎫"
                    title="Student Gets QR Code"
                    desc="When a student enrolls in a subject, a unique permanent QR Code is auto-generated and linked to their profile. It never changes or expires."
                />
                <InfoCard
                    icon="📷"
                    title="Faculty Scans QR"
                    desc="Faculty opens Mark Attendance, points the camera scanner at the student's QR Code, and attendance is marked present instantly — no student action needed."
                />
                <InfoCard
                    icon="🔒"
                    title="Permanent & Unique"
                    desc="Each student's QR Code never regenerates. It is tied to their enrollment and cannot be duplicated or reused by another student."
                />
            </div>

            <div style={{ marginTop: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontWeight: 700 }}>Quick Links</h4>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                        onClick={() => navigate("/admin/smart-attendance")}
                        style={btnStyle("#6366f1")}
                    >
                        📷 Faculty Scanner — Mark Attendance
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// REPORTS TAB  (Phase 8 + 12)
// ─────────────────────────────────────────────────────────────────
function ReportsTab() {
    const [reportType, setReportType] = useState("late");
    const [startDate, setStartDate] = useState(
        new Date(new Date().setDate(1)).toISOString().split("T")[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const endpoint =
                reportType === "late"
                    ? `/biometric/late-report?start_date=${startDate}&end_date=${endDate}`
                    : `/biometric/absent-report?start_date=${startDate}&end_date=${endDate}`;
            const res = await api.get(endpoint);
            if (res.data.success) setData(res.data.data);
        } catch { toast.error("Failed to load report"); }
        finally { setLoading(false); }
    };

    const exportCSV = () => {
        if (!data.length) return;
        const headers = reportType === "late"
            ? ["Date", "Student", "Time In", "Late By (min)"]
            : ["Date", "Student"];
        const rows = data.map((r) =>
            reportType === "late"
                ? [r.date, r.name, r.time_in, r.late_by_minutes]
                : [r.date, r.name]
        );
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `biometric_${reportType}_report_${startDate}_to_${endDate}.csv`;
        a.click();
    };

    return (
        <div>
            {/* Filter Bar */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "flex-end" }}>
                <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Report Type</label>
                    <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={inputStyle}>
                        <option value="late">Late Arrivals</option>
                        <option value="absent">Absent Students</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
                </div>
                <button onClick={fetchReport} style={btnStyle("#6366f1")} disabled={loading}>
                    {loading ? "Loading..." : "Generate Report"}
                </button>
                {data.length > 0 && (
                    <button onClick={exportCSV} style={btnStyle("#10b981")}>📥 Export CSV</button>
                )}
                {/* Phase 12: Excel Export */}
                <button
                    onClick={() => {
                        const token = localStorage.getItem("token");
                        const url = `${import.meta.env.VITE_API_URL || ''}/api/biometric/export/excel?start_date=${startDate}&end_date=${endDate}`;
                        const a = document.createElement("a");
                        a.href = url;
                        a.target = "_blank";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }}
                    style={btnStyle("#059669")}
                >
                    📊 Export Excel
                </button>
            </div>

            {/* Results */}
            {loading ? (
                <LoadingCard />
            ) : data.length === 0 ? (
                <Empty msg="Run a report to see data" />
            ) : (
                <div className="card" style={{ padding: "1.5rem" }}>
                    <h4 style={{ margin: "0 0 1rem" }}>
                        {reportType === "late" ? "⚠️ Late Arrivals" : "❌ Absent Students"} — {data.length} records
                    </h4>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                            <thead>
                                <tr style={{ background: "var(--table-header, rgba(99,102,241,0.1))" }}>
                                    {reportType === "late"
                                        ? ["Date", "Student", "Time In", "Late By"].map((h) => <th key={h} style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700 }}>{h}</th>)
                                        : ["Date", "Student"].map((h) => <th key={h} style={{ padding: "0.75rem", textAlign: "left", fontWeight: 700 }}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                        <td style={{ padding: "0.7rem" }}>{r.date}</td>
                                        <td style={{ padding: "0.7rem" }}>{r.name || "—"}</td>
                                        {reportType === "late" && (
                                            <>
                                                <td style={{ padding: "0.7rem" }}>{r.time_in}</td>
                                                <td style={{ padding: "0.7rem", color: "#f59e0b", fontWeight: 600 }}>{r.late_by_minutes} min</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// SETTINGS TAB  (Phase 5)
// ─────────────────────────────────────────────────────────────────
function SettingsTab() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get("/biometric/settings").then((res) => {
            if (res.data.success) setSettings(res.data.data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put("/biometric/settings", settings);
            toast.success("Settings saved");
        } catch { toast.error("Failed to save"); }
        finally { setSaving(false); }
    };

    const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

    if (loading) return <LoadingCard />;
    if (!settings) return <Empty msg="No settings found" />;

    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const workingDays = settings.working_days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const toggleDay = (day) => {
        const updated = workingDays.includes(day)
            ? workingDays.filter((d) => d !== day)
            : [...workingDays, day];
        update("working_days", updated);
    };

    return (
        <div className="card" style={{ padding: "2rem", maxWidth: "600px" }}>
            <h3 style={{ margin: "0 0 1.5rem" }}>⚙️ Biometric Attendance Settings</h3>

            <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Class Start Time</label>
                <input type="time" value={settings.class_start_time || "09:00"} onChange={(e) => update("class_start_time", e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Late Threshold (minutes after class start)</label>
                <input type="number" min="0" max="60" value={settings.late_threshold_minutes || 15} onChange={(e) => update("late_threshold_minutes", parseInt(e.target.value))} style={inputStyle} />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Half Day Threshold (minutes after class start)</label>
                <input type="number" min="30" max="300" value={settings.half_day_threshold_minutes || 120} onChange={(e) => update("half_day_threshold_minutes", parseInt(e.target.value))} style={inputStyle} />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Duplicate Punch Window (seconds)</label>
                <input type="number" min="60" max="1800" value={settings.duplicate_punch_window_secs || 300} onChange={(e) => update("duplicate_punch_window_secs", parseInt(e.target.value))} style={inputStyle} />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Working Days</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {DAYS.map((day) => (
                        <button
                            key={day}
                            onClick={() => toggleDay(day)}
                            style={{
                                padding: "0.4rem 0.8rem", borderRadius: "8px", border: "2px solid",
                                borderColor: workingDays.includes(day) ? "#6366f1" : "var(--border-color)",
                                background: workingDays.includes(day) ? "rgba(99,102,241,0.15)" : "transparent",
                                color: workingDays.includes(day) ? "#6366f1" : "var(--text-secondary)",
                                cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                            }}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
                <label style={labelStyle}>Parent Notifications</label>
                {[
                    { key: "notify_parent_on_present", label: "Notify when student marks present" },
                    { key: "notify_parent_on_late", label: "Notify when student arrives late" },
                    { key: "notify_parent_on_absent", label: "Notify when student is absent" },
                ].map(({ key, label }) => (
                    <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={!!settings[key]}
                            onChange={(e) => update(key, e.target.checked)}
                        />
                        <span style={{ fontSize: "0.9rem" }}>{label}</span>
                    </label>
                ))}
            </div>

            <button onClick={handleSave} disabled={saving} style={btnStyle("#6366f1")}>
                {saving ? "Saving..." : "💾 Save Settings"}
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// SHARED UI HELPERS
// ─────────────────────────────────────────────────────────────────

function StatBox({ icon, label, value, color }) {
    return (
        <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "2rem", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: `${color}1a`, borderRadius: "12px" }}>
                {icon}
            </div>
            <div>
                <div style={{ fontWeight: 800, fontSize: "1.4rem", color }}>{value}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{label}</div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const cfg = {
        present: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Present" },
        absent: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Absent" },
        late: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Late" },
        half_day: { bg: "rgba(99,102,241,0.15)", color: "#6366f1", label: "Half Day" },
    };
    const c = cfg[status] || { bg: "rgba(107,114,128,0.15)", color: "#6b7280", label: status };
    return (
        <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, background: c.bg, color: c.color }}>
            {c.label}
        </span>
    );
}

function InfoCard({ icon, title, desc }) {
    return (
        <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
            <h4 style={{ margin: "0 0 0.5rem", fontWeight: 700 }}>{title}</h4>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5 }}>{desc}</p>
        </div>
    );
}

function Modal({ title, children, onClose }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: "var(--card-bg, #fff)", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h3 style={{ margin: 0, fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "var(--text-secondary)" }}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

function FormField({ label, value, onChange, placeholder, disabled, type = "text" }) {
    return (
        <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", display: "block" }}>{label}</label>
            <input
                type={type} value={value} onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder} disabled={disabled}
                style={{ ...inputStyle, opacity: disabled ? 0.6 : 1 }}
            />
        </div>
    );
}

function LoadingCard() {
    return (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
            <div>Loading...</div>
        </div>
    );
}

function Empty({ msg }) {
    return (
        <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔍</div>
            <div>{msg}</div>
        </div>
    );
}

// Styles
const inputStyle = { width: "100%", padding: "0.6rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--input-bg, #fff)", color: "var(--text-primary)", fontSize: "0.9rem", boxSizing: "border-box" };
const labelStyle = { fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem", display: "block" };
const btnStyle = (bg) => ({ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none", background: bg, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap" });
const btnSmall = (bg) => ({ ...btnStyle(bg), padding: "0.35rem 0.8rem", fontSize: "0.8rem" });
