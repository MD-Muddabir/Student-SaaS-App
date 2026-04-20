import { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../admin/Dashboard.css"; // Reuse dashboard UI

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function StudentTimetable() {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [slots, setSlots] = useState([]);
    const [timetable, setTimetable] = useState([]);

    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");

    useEffect(() => {
        fetchStudentData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudentTimetable(selectedClass);
        } else {
            setTimetable([]);
        }
    }, [selectedClass]);

    const fetchStudentData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/students/me");
            const studentData = res.data.data;
            if (studentData && studentData.Classes && studentData.Classes.length > 0) {
                setClasses(studentData.Classes);
                setSelectedClass(studentData.Classes[0].id);
            } else {
                setLoading(false); // No classes assigned
            }
        } catch (error) {
            console.error("Error fetching student data", error);
            setLoading(false);
        }
    };

    const fetchStudentTimetable = async (classId) => {
        setLoading(true);
        try {
            const [slotsRes, timetableRes] = await Promise.all([
                api.get("/timetable/slots"),
                api.get(`/timetable/class/${classId}`)
            ]);
            setSlots(slotsRes.data.data || []);
            setTimetable(timetableRes.data.data || []);
        } catch (error) {
            console.error("Error fetching timetable", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="dashboard-container">Loading Class Schedule...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📅 My Class Timetable</h1>
                    <p>View your weekly class schedule and subjects.</p>
                </div>
            </div>

            {classes.length > 1 && (
                <div className="filter-container" style={{ marginBottom: "2rem" }}>
                    <span className="filter-label">Select Class:</span>
                    <select
                        className="form-select"
                        style={{ width: "250px", margin: 0 }}
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {slots.length === 0 ? (
                <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No time slots or schedules have been set up by the institute administrators.
                </div>
            ) : (
                <div className="card" style={{ overflowX: "auto" }}>
                    <table className="table timetable-table mobile-keep" style={{ minWidth: "800px" }}>
                        <thead>
                            <tr>
                                <th style={{ width: "120px" }}></th>
                                {DAYS_OF_WEEK.map(day => (
                                    <th key={day} style={{ textAlign: "center", background: '#f8fafc', borderRadius: '12px' }}>{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map((slot, idx) => (
                                <tr key={slot.id}>
                                    <td className="time-slot-label">
                                        <strong>Period {idx + 1}</strong>
                                        <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                                    </td>
                                    {DAYS_OF_WEEK.map(day => {
                                        const entry = timetable.find(t => t.slot_id === slot.id && t.day_of_week === day);

                                        let colorClass = "pill-color-0";
                                        if (entry && entry.subject_id) {
                                            colorClass = `pill-color-${entry.subject_id % 7}`;
                                        }

                                        return (
                                            <td key={`${slot.id}-${day}`}>
                                                {entry ? (
                                                    <div className={`timetable-pill ${colorClass}`}>
                                                        <span>{entry.Subject?.name}</span>
                                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>{entry.Faculty?.User?.name}</div>
                                                    </div>
                                                ) : (
                                                    <div className="timetable-pill" style={{ backgroundColor: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                                                        -
                                                    </div>
                                                )}
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
    );
}

export default StudentTimetable;
