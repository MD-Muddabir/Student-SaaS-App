import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import ThemeSelector from "../../components/ThemeSelector";
import "../faculty/Dashboard"; // Reuse dashboard UI
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function ViewAttendance() {
    const { user } = useContext(AuthContext);
    const dashboardPath = user?.role === "admin" || user?.role === "superadmin" || user?.role === "super_admin" || user?.role === "manager"
        ? "/admin/dashboard"
        : "/faculty/dashboard";

    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");

    // Default to current month string: 'YYYY-MM'
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

    const [gridData, setGridData] = useState([]);
    const [stats, setStats] = useState({
        overallRate: 0,
        totalStudents: 0,
        lateArrivals: 0,
        absencesToday: 0
    });

    // Export Modal State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState("");
    const [exportFilter, setExportFilter] = useState("all");

    // Calculate days configuration based on chosen month
    const [y, m] = selectedMonth.split('-');
    const daysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthName = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchSubjects();
        } else {
            setSubjects([]);
            setSelectedSubject("");
        }
    }, [selectedClass]);

    useEffect(() => {
        const fetchWhenReady = setTimeout(() => {
            if (selectedClass && selectedSubject && selectedMonth) {
                fetchGridData();
            }
        }, 300);
        return () => clearTimeout(fetchWhenReady);
    }, [selectedClass, selectedSubject, selectedMonth]);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/classes");
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await api.get(`/subjects?class_id=${selectedClass}`);
            setSubjects(response.data.data || []);
            // Auto-select first subject to save clicks
            if (response.data.data && response.data.data.length > 0) {
                setSelectedSubject(response.data.data[0].id);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const fetchGridData = async () => {
        try {
            setLoading(true);
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

            const response = await api.get(`/attendance/class/${selectedClass}/subject/${selectedSubject}/grid?start_date=${startDate}&end_date=${endDate}`);

            if (response.data.success) {
                const data = response.data.data;
                setGridData(data);

                // Calculate quick stats logic
                const totalStudentsCount = data.length;
                let totalPresent = 0;
                let totalRecords = 0;
                let lateCount = 0;
                let absentCount = 0;

                const todayStr = new Date().toISOString().split('T')[0];
                let todayAbsences = 0;

                data.forEach(student => {
                    totalPresent += student.present_days;
                    totalRecords += student.total_days;
                    lateCount += student.late_days;
                    absentCount += student.absent_days;

                    if (student.daily[todayStr] === 'absent') {
                        todayAbsences++;
                    }
                });

                setStats({
                    overallRate: totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : 0,
                    totalStudents: totalStudentsCount,
                    lateArrivals: lateCount,
                    absencesToday: todayAbsences
                });
            }
        } catch (error) {
            console.error("Error fetching attendance grid:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type) => {
        if (gridData.length === 0) {
            alert("No attendance data to export.");
            return;
        }
        setExportType(type);
        setExportFilter("all");
        setShowExportModal(true);
    };

    const confirmExport = () => {
        exportGridData(exportType, exportFilter);
        setShowExportModal(false);
    };

    const exportGridData = (type, filterStr) => {
        const className = classes.find(c => String(c.id) === String(selectedClass))?.name || "Unknown Class";
        const subjectName = subjects.find(s => String(s.id) === String(selectedSubject))?.name || "Unknown Subject";
        const title = `Attendance Grid - ${className} (${subjectName}) - ${monthName} - ${filterStr.toUpperCase()}`;

        const columns = ["ID", "Student Name", ...daysArray.map(d => String(d)), "P", "A", "L", "H", "W"];

        let targetRows = gridData;

        if (filterStr === "present") {
            targetRows = targetRows.filter(r => r.present_days > 0);
        } else if (filterStr === "absent") {
            targetRows = targetRows.filter(r => r.absent_days > 0);
        } else if (filterStr === "late") {
            targetRows = targetRows.filter(r => r.late_days > 0);
        } else if (filterStr === "holiday") {
            targetRows = targetRows.filter(r => r.holiday_days > 0);
        }

        if (targetRows.length === 0) {
            alert(`No records found for the filter: ${filterStr}`);
            return;
        }

        const rows = targetRows.map(student => {
            const dailyStatus = daysArray.map(day => {
                const dayString = String(day).padStart(2, '0');
                const fullDateStr = `${y}-${m}-${dayString}`;
                const status = student.daily[fullDateStr];
                if (status === 'present') return 'P';
                if (status === 'absent') return 'A';
                if (status === 'late') return 'L';
                if (status === 'holiday') return 'H';
                return '-';
            });

            return [
                student.student_id,
                student.name,
                ...dailyStatus,
                student.present_days,
                student.absent_days,
                student.late_days,
                student.holiday_days || 0,
                student.working_days
            ];
        });

        if (type === "PDF") {
            const doc = new jsPDF('landscape');
            doc.text(title, 14, 15);
            autoTable(doc, {
                head: [columns],
                body: rows,
                startY: 20,
                styles: { fontSize: 7, cellPadding: 1 },
                headStyles: { fillColor: [66, 66, 66] }
            });
            doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
        } else if (type === "Excel") {
            const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Grid");
            XLSX.writeFile(workbook, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`);
        }
    };

    const getStatusIcon = (status) => {
        if (!status) return <span style={{ color: '#d1d5db' }}>-</span>;
        if (status === 'present') return <span style={{ color: '#10b981', backgroundColor: '#d1fae5', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>✓</span>;
        if (status === 'absent') return <span style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>X</span>;
        if (status === 'late') return <span style={{ color: '#f59e0b', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>L</span>;
        if (status === 'holiday') return <span style={{ color: '#3b82f6', backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>H</span>;
        return <span style={{ color: '#d1d5db' }}>-</span>;
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Attendance Tracker</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Daily presence monitoring — {monthName}</p>
                </div>
                <div className="dashboard-header-right" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={() => handleExport("PDF")} className="btn btn-primary" style={{ backgroundColor: "#ef4444", borderColor: "#ef4444", padding: '0.5rem 1rem' }}>📄 PDF</button>
                    <button onClick={() => handleExport("Excel")} className="btn btn-primary" style={{ backgroundColor: "#10b981", borderColor: "#10b981", padding: '0.5rem 1rem' }}>📊 Excel</button>
                    <ThemeSelector />
                    <Link to={dashboardPath} className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            {/* Filter Section */}
            <div className="filter-container" style={{
                display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem',
                padding: '1rem', borderRadius: '12px', backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.05))',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎯</span>
                    <strong style={{ color: 'var(--text-primary)', marginLeft: '4px' }}>Filters:</strong>
                </div>
                <select
                    className="form-select"
                    style={{ padding: '0.6rem 1rem', minWidth: '150px', margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                >
                    <option value="">-- Choose Class --</option>
                    {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name} {cls.section ? `(${cls.section})` : ""}
                        </option>
                    ))}
                </select>
                <select
                    className="form-select"
                    style={{ padding: '0.6rem 1rem', minWidth: '150px', margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!selectedClass}
                >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                            {sub.name}
                        </option>
                    ))}
                </select>
                <input
                    type="month"
                    className="form-input"
                    style={{ padding: '0.6rem 1rem', margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)' }}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                />
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '1.5rem' }}>
                    <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>✓</div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Rate</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{stats.overallRate}%</h3>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '1.5rem' }}>
                    <div className="stat-icon" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>👥</div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Students</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{stats.totalStudents}</h3>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '1.5rem' }}>
                    <div className="stat-icon" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>⏱️</div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Late Arrivals</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{stats.lateArrivals}</h3>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '1.5rem' }}>
                    <div className="stat-icon" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>X</div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Absences Today</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{stats.absencesToday}</h3>
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <div className="card" style={{ padding: "0" }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Monthly Attendance Grid</h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table className="table mobile-keep" style={{ borderCollapse: "collapse", minWidth: "1200px" }}>
                        <thead>
                            <tr>
                                <th style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    borderBottom: '1px solid var(--border-color)',
                                    minWidth: '200px',
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: 'var(--card-bg)',
                                    zIndex: 1
                                }}>Student</th>
                                {daysArray.map(day => {
                                    const dateObj = new Date(parseInt(y), parseInt(m) - 1, day);
                                    const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                                    return (
                                        <th key={day} style={{
                                            padding: '1rem 0.5rem',
                                            textAlign: 'center',
                                            borderBottom: '1px solid var(--border-color)',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.8rem',
                                            minWidth: '35px'
                                        }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 'normal', marginBottom: '2px' }}>{dayOfWeek}</div>
                                            <div>{day}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={daysInMonth + 1} style={{ textAlign: "center", padding: "2rem", color: 'var(--text-secondary)' }}>
                                        Loading grid data...
                                    </td>
                                </tr>
                            ) : gridData.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 1} style={{ textAlign: "center", padding: "2rem", color: 'var(--text-secondary)' }}>
                                        No students found. Please select Class and Subject.
                                    </td>
                                </tr>
                            ) : (
                                gridData.map(student => (
                                    <tr key={student.student_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{
                                            padding: '0.8rem 1rem',
                                            position: 'sticky',
                                            left: 0,
                                            backgroundColor: 'var(--card-bg)',
                                            zIndex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                {student.name}
                                            </span>
                                        </td>
                                        {daysArray.map(day => {
                                            const dayString = String(day).padStart(2, '0');
                                            const fullDateStr = `${y}-${m}-${dayString}`;
                                            return (
                                                <td key={fullDateStr} style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                    {getStatusIcon(student.daily[fullDateStr])}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Export Selection Modal */}
            {showExportModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Export {exportType}</h2>
                            <button onClick={() => setShowExportModal(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: "1rem" }}>Which records would you like to export?</p>

                            <div className="form-group">
                                <label className="form-label">Select Group</label>
                                <select
                                    className="form-input"
                                    value={exportFilter}
                                    onChange={(e) => setExportFilter(e.target.value)}
                                >
                                    <option value="all">All Students (In Selected Month)</option>
                                    <option value="present">Students Present (≥ 1 day)</option>
                                    <option value="absent">Students Absent (≥ 1 day)</option>
                                    <option value="late">Students Late (≥ 1 day)</option>
                                    <option value="holiday">Students On Holiday (≥ 1 day)</option>
                                </select>
                            </div>

                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowExportModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={confirmExport} className="btn btn-primary">Download {exportType}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ViewAttendance;
