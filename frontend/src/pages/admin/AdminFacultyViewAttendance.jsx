import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../admin/Dashboard.css"; // Reuse dashboard UI

const MONTHS = [
    { value: 1, label: "January" }, { value: 2, label: "February" },
    { value: 3, label: "March" }, { value: 4, label: "April" },
    { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" },
    { value: 9, label: "September" }, { value: 10, label: "October" },
    { value: 11, label: "November" }, { value: 12, label: "December" }
];

function AdminFacultyViewAttendance() {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState([]);

    useEffect(() => {
        fetchGridData();
    }, [month, year]);

    const fetchGridData = async () => {
        try {
            setLoading(true);

            // Construct start and end dates based on month and year
            const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

            const response = await api.get(`/faculty-attendance/grid?start_date=${startDate}&end_date=${endDate}`);
            setAttendanceData(response.data.data || []);
        } catch (error) {
            console.error("Error fetching faculty attendance grid:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate overall stats
    const totalFaculty = attendanceData.length;

    let totalPossibleDays = 0;
    let totalPresentDays = 0;
    let totalLateDays = 0;
    let totalAbsentDays = 0;

    attendanceData.forEach(f => {
        totalPossibleDays += f.total_days;
        totalPresentDays += f.present_days;
        totalLateDays += f.late_days;
        totalAbsentDays += f.absent_days;
    });

    const overallRate = totalPossibleDays > 0
        ? ((totalPresentDays / totalPossibleDays) * 100).toFixed(1)
        : "0.0";

    const getDaysInMonth = (m, y) => new Date(y, m, 0).getDate();
    const daysInSelectedMonth = getDaysInMonth(month, year);
    const daysArray = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

    return (
        <div className="dashboard-container" style={{ padding: "2rem" }}>
            <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1>📊 Faculty Attendance Tracker</h1>
                    <p>Daily presence monitoring — {MONTHS.find(m => m.value === month)?.label} {year}</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/admin/faculty-attendance" className="btn btn-primary" style={{ backgroundColor: "#4f46e5" }}>
                        📸 Quick Mark
                    </Link>
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>🎯 Filters:</h3>
                <div className="content-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <div className="form-group">
                        <select
                            className="form-input"
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            style={{ backgroundColor: "var(--bg-secondary)" }}
                        >
                            {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <select
                            className="form-input"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            style={{ backgroundColor: "var(--bg-secondary)" }}
                        >
                            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card" style={{ background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white" }}>
                    <div className="stat-icon" style={{ background: "rgba(255,255,255,0.2)" }}>✔️</div>
                    <div className="stat-content">
                        <h3 style={{ color: "white" }}>{overallRate}%</h3>
                        <p style={{ color: "rgba(255,255,255,0.8)" }}>OVERALL RATE</p>
                    </div>
                </div>
                <div className="stat-card" style={{ background: "linear-gradient(135deg, #4f46e5, #818cf8)", color: "white" }}>
                    <div className="stat-icon" style={{ background: "rgba(255,255,255,0.2)" }}>👥</div>
                    <div className="stat-content">
                        <h3 style={{ color: "white" }}>{totalFaculty}</h3>
                        <p style={{ color: "rgba(255,255,255,0.8)" }}>FACULTY</p>
                    </div>
                </div>
                <div className="stat-card" style={{ background: "linear-gradient(135deg, #0f766e, #14b8a6)", color: "white" }}>
                    <div className="stat-icon" style={{ background: "rgba(255,255,255,0.2)" }}>⏱️</div>
                    <div className="stat-content">
                        <h3 style={{ color: "white" }}>{totalLateDays}</h3>
                        <p style={{ color: "rgba(255,255,255,0.8)" }}>LATE ARRIVALS</p>
                    </div>
                </div>
                <div className="stat-card" style={{ background: "linear-gradient(135deg, #9f1239, #f43f5e)", color: "white" }}>
                    <div className="stat-icon" style={{ background: "rgba(255,255,255,0.2)" }}>❌</div>
                    <div className="stat-content">
                        <h3 style={{ color: "white" }}>{totalAbsentDays}</h3>
                        <p style={{ color: "rgba(255,255,255,0.8)" }}>ABSENCES THIS MONTH</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Monthly Attendance Grid</h3>
                </div>
                <div className="card-body" style={{ padding: "0" }}>
                    {loading ? (
                        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading attendance data...</div>
                    ) : attendanceData.length === 0 ? (
                        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No faculty records found.</div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                                <thead style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                                    <tr>
                                        <th style={{ padding: "15px", textAlign: "left", position: "sticky", left: 0, backgroundColor: "var(--bg-secondary)", zIndex: 1, minWidth: "200px" }}>FACULTY</th>
                                        {daysArray.map(d => (
                                            <th key={d} style={{ padding: "10px 5px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.map((faculty, rowIndex) => (
                                        <tr key={faculty.faculty_id} style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: rowIndex % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)" }}>
                                            <td style={{ padding: "15px", fontWeight: "bold", position: "sticky", left: 0, backgroundColor: "inherit", zIndex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold" }}>
                                                        {faculty.name?.charAt(0) || "F"}
                                                    </div>
                                                    {faculty.name || "Unknown"}
                                                </div>
                                            </td>
                                            {daysArray.map(d => {
                                                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                const status = faculty.daily[dateStr];

                                                let icon = "-";
                                                let color = "var(--text-muted)";
                                                let bgColor = "transparent";

                                                if (status === "present") {
                                                    icon = "✓";
                                                    color = "#10b981";
                                                    bgColor = "rgba(16, 185, 129, 0.1)";
                                                } else if (status === "absent") {
                                                    icon = "✗";
                                                    color = "#ef4444";
                                                    bgColor = "rgba(239, 68, 68, 0.1)";
                                                } else if (status === "late") {
                                                    icon = "L";
                                                    color = "#f59e0b";
                                                    bgColor = "rgba(245, 158, 11, 0.1)";
                                                } else if (status === "holiday") {
                                                    icon = "H";
                                                    color = "#3b82f6";
                                                    bgColor = "rgba(59, 130, 246, 0.1)";
                                                }

                                                return (
                                                    <td key={d} style={{ textAlign: "center", padding: "5px" }}>
                                                        <div style={{
                                                            width: "24px",
                                                            height: "24px",
                                                            margin: "0 auto",
                                                            borderRadius: "4px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: color,
                                                            backgroundColor: bgColor,
                                                            fontWeight: "bold",
                                                            fontSize: "0.9rem"
                                                        }}>
                                                            {icon}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminFacultyViewAttendance;
