import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

function AdminManageFacultyAttendance() {
    const { user } = useContext(AuthContext);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [facultyList, setFacultyList] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [dashboardStats, setDashboardStats] = useState(null);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchFacultyAttendance();
        } else {
            setFacultyList([]);
        }
    }, [selectedDate]);

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get("/faculty-attendance/dashboard");
            setDashboardStats(response.data.data);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    };

    const fetchFacultyAttendance = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/faculty-attendance/date/${selectedDate}`);
            setFacultyList(response.data.data || []);

            // Initialize attendance data
            const initialData = {};
            response.data.data.forEach(faculty => {
                if (faculty.attendance) {
                    initialData[faculty.faculty_id] = {
                        status: faculty.attendance.status,
                        remarks: faculty.attendance.remarks || ""
                    };
                } else {
                    initialData[faculty.faculty_id] = {
                        status: "present",
                        remarks: ""
                    };
                }
            });
            setAttendanceData(initialData);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            alert("Error loading attendance data");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (facultyId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [facultyId]: {
                ...prev[facultyId],
                status
            }
        }));
    };

    const handleRemarksChange = (facultyId, remarks) => {
        setAttendanceData(prev => ({
            ...prev,
            [facultyId]: {
                ...prev[facultyId],
                remarks
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedDate) {
            alert("Please select a date");
            return;
        }

        try {
            const pendingFaculty = facultyList.filter(f => !f.attendance);

            const attendance_payload = pendingFaculty.map(faculty => ({
                faculty_id: faculty.faculty_id,
                status: attendanceData[faculty.faculty_id].status,
                remarks: attendanceData[faculty.faculty_id].remarks
            }));

            if (attendance_payload.length === 0) {
                alert("No pending faculty to submit.");
                return;
            }

            await api.post("/faculty-attendance/manual", {
                date: selectedDate,
                attendance_data: attendance_payload
            });

            alert("Faculty Attendance marked successfully!");
            fetchDashboardStats();
            fetchFacultyAttendance();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error marking attendance";
            alert(errorMessage);
        }
    };

    const markAllPresent = () => {
        const newData = { ...attendanceData };
        facultyList.filter(f => !f.attendance).forEach(faculty => {
            newData[faculty.faculty_id] = {
                status: "present",
                remarks: attendanceData[faculty.faculty_id]?.remarks || ""
            };
        });
        setAttendanceData(newData);
    };

    const markAllAbsent = () => {
        const newData = { ...attendanceData };
        facultyList.filter(f => !f.attendance).forEach(faculty => {
            newData[faculty.faculty_id] = {
                status: "absent",
                remarks: attendanceData[faculty.faculty_id]?.remarks || ""
            };
        });
        setAttendanceData(newData);
    };

    const markAllHoliday = () => {
        const newData = { ...attendanceData };
        facultyList.filter(f => !f.attendance).forEach(faculty => {
            newData[faculty.faculty_id] = {
                status: "holiday",
                remarks: attendanceData[faculty.faculty_id]?.remarks || ""
            };
        });
        setAttendanceData(newData);
    };

    const pendingFaculty = facultyList.filter(f => !f.attendance);
    const markedFaculty = facultyList.filter(f => f.attendance);

    return (
        <div className="dashboard-container" style={{ padding: "2rem" }}>
            <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1>📝 Faculty Attendance Management</h1>
                    <p>Mark and track daily faculty attendance manually</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/admin/view-faculty-attendance" className="btn btn-primary" style={{ backgroundColor: "#4f46e5" }}>
                        📊 View Report
                    </Link>
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            {/* Dashboard Stats */}
            {dashboardStats && (
                <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                    <div className="stat-card">
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                            <h3>{dashboardStats.today.percentage}%</h3>
                            <p>Today's Attendance</p>
                            <small>{dashboardStats.today.present}/{dashboardStats.today.total} present</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <h3>{dashboardStats.this_month.percentage}%</h3>
                            <p>This Month Average</p>
                            <small>{dashboardStats.this_month.present}/{dashboardStats.this_month.total} present</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-content">
                            <h3>{dashboardStats.low_attendance_count}</h3>
                            <p>Below Priority</p>
                            <small>Faculty at risk (3+ leaves)</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem" }}>
                    <div className="form-group" style={{ maxWidth: "300px" }}>
                        <label className="form-label">Select Date *</label>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            style={{ backgroundColor: "var(--bg-secondary)" }}
                        />
                    </div>
                </div>
            </div>

            {/* Attendance Marking - Pending */}
            {selectedDate && (
                <div className="card" style={{ marginBottom: "2rem" }}>
                    <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            ⏳ Pending Faculty ({pendingFaculty.length} faculty)
                        </h3>
                        {pendingFaculty.length > 0 && (
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button onClick={markAllPresent} type="button" className="btn btn-sm btn-success">
                                    ✓ All Present
                                </button>
                                <button onClick={markAllAbsent} type="button" className="btn btn-sm btn-danger">
                                    × All Absent
                                </button>
                                <button onClick={markAllHoliday} type="button" className="btn btn-sm" style={{ backgroundColor: "#3b82f6", color: "white" }}>
                                    🏖️ Holiday
                                </button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading faculty details...</div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="table-container" style={{ padding: "0" }}>
                                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                                        <tr>
                                            <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>ID</th>
                                            <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>FACULTY NAME</th>
                                            <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>STATUS</th>
                                            <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>REMARKS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingFaculty.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontWeight: "bold" }}>
                                                    Attendance already submitted for all faculty today. ✅
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingFaculty.map((faculty) => (
                                                <tr key={faculty.faculty_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                                    <td style={{ padding: "15px" }}>
                                                        <span className="badge badge-secondary" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", fontWeight: "bold", color: "var(--text-color)" }}>
                                                            FAC-{faculty.faculty_id}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "15px" }}>
                                                        <strong style={{ color: "var(--text-color)" }}>{faculty.name}</strong>
                                                        <br />
                                                        <small style={{ color: "var(--text-muted)" }}>{faculty.email}</small>
                                                    </td>
                                                    <td style={{ padding: "15px" }}>
                                                        <div style={{ display: "flex", gap: "15px" }}>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${faculty.faculty_id}`}
                                                                    value="present"
                                                                    checked={attendanceData[faculty.faculty_id]?.status === "present"}
                                                                    onChange={() => handleStatusChange(faculty.faculty_id, "present")}
                                                                />
                                                                <span style={{ color: "#10b981", fontWeight: "bold" }}>Present</span>
                                                            </label>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${faculty.faculty_id}`}
                                                                    value="absent"
                                                                    checked={attendanceData[faculty.faculty_id]?.status === "absent"}
                                                                    onChange={() => handleStatusChange(faculty.faculty_id, "absent")}
                                                                />
                                                                <span style={{ color: "#ef4444", fontWeight: "bold" }}>Absent</span>
                                                            </label>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${faculty.faculty_id}`}
                                                                    value="late"
                                                                    checked={attendanceData[faculty.faculty_id]?.status === "late"}
                                                                    onChange={() => handleStatusChange(faculty.faculty_id, "late")}
                                                                />
                                                                <span style={{ color: "#f59e0b", fontWeight: "bold" }}>Late</span>
                                                            </label>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${faculty.faculty_id}`}
                                                                    value="holiday"
                                                                    checked={attendanceData[faculty.faculty_id]?.status === "holiday"}
                                                                    onChange={() => handleStatusChange(faculty.faculty_id, "holiday")}
                                                                />
                                                                <span style={{ color: "#3b82f6", fontWeight: "bold" }}>Holiday</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "15px" }}>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="Optional remarks"
                                                            value={attendanceData[faculty.faculty_id]?.remarks || ""}
                                                            onChange={(e) => handleRemarksChange(faculty.faculty_id, e.target.value)}
                                                            style={{ minWidth: "200px", backgroundColor: "var(--bg-secondary)" }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {pendingFaculty.length > 0 && (
                                <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border-color)", textAlign: "right", backgroundColor: "var(--bg-secondary)" }}>
                                    <button type="submit" className="btn btn-primary" style={{ minWidth: "200px", padding: "0.8rem", fontSize: "1rem", backgroundColor: "#4f46e5", border: "none" }}>
                                        ✓ Submit Attendance
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            )}

            {/* Attendance Marking - Marked */}
            {selectedDate && markedFaculty.length > 0 && (
                <div className="card">
                    <div className="card-header" style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px", color: "#10b981" }}>
                            ✅ Marked Attendance ({markedFaculty.length} faculty)
                        </h3>
                    </div>

                    <div className="table-container" style={{ padding: "0" }}>
                        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                                <tr>
                                    <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>ID</th>
                                    <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>FACULTY NAME</th>
                                    <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>MARKED STATUS</th>
                                    <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>REMARKS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {markedFaculty.map((faculty) => (
                                    <tr key={faculty.faculty_id} style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "rgba(16, 185, 129, 0.02)" }}>
                                        <td style={{ padding: "15px" }}>
                                            <span className="badge badge-secondary" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", fontWeight: "bold", color: "var(--text-color)" }}>
                                                FAC-{faculty.faculty_id}
                                            </span>
                                        </td>
                                        <td style={{ padding: "15px" }}>
                                            <strong style={{ color: "var(--text-color)" }}>{faculty.name}</strong>
                                            <br />
                                            <small style={{ color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>{faculty.email}</small>
                                            <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>✓ Saved in DB</span>
                                        </td>
                                        <td style={{ padding: "15px", fontWeight: "bold", color: faculty.attendance.status === 'present' ? '#10b981' : faculty.attendance.status === 'absent' ? '#ef4444' : faculty.attendance.status === 'holiday' ? '#3b82f6' : '#f59e0b' }}>
                                            {faculty.attendance.status.charAt(0).toUpperCase() + faculty.attendance.status.slice(1)}
                                        </td>
                                        <td style={{ padding: "15px", color: "var(--text-muted)" }}>
                                            {faculty.attendance.remarks || "-"}
                                        </td>
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

export default AdminManageFacultyAttendance;
