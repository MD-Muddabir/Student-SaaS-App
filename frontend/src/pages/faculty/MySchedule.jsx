import { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../admin/Dashboard.css";

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function FacultySchedule() {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [myTimetable, setMyTimetable] = useState([]);
    const [classTimetables, setClassTimetables] = useState([]);
    const [slots, setSlots] = useState([]);

    useEffect(() => {
        if (user) {
            fetchMySchedule();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchMySchedule = async () => {
        setLoading(true);
        try {
            // Get all slots first to generate grid uniformly
            const slotsRes = await api.get("/timetable/slots");
            setSlots(slotsRes.data.data || []);

            // Get faculty schedule
            const response = await api.get(`/timetable/faculty/me`);
            const myTs = response.data.data || [];
            setMyTimetable(myTs);

            // Extract unique class IDs that the faculty teaches
            const myClassIds = [...new Set(myTs.filter(t => t.class_id).map(t => t.class_id))];

            // Fetch entire timetable for those classes
            const classRes = await Promise.all(
                myClassIds.map(id => api.get(`/timetable/class/${id}`))
            );

            const allClassTimetables = myClassIds.map((id, index) => ({
                class_id: id,
                class_name: myTs.find(t => t.class_id === id)?.Class?.name,
                data: classRes[index].data.data || []
            }));

            setClassTimetables(allClassTimetables);
        } catch (error) {
            console.error("Error fetching my schedule", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="dashboard-container">Loading Schedule...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📅 My Teaching Schedule</h1>
                    <p>View the full timetable for classes you teach. Your subjects are highlighted.</p>
                </div>
            </div>

            {classTimetables.length === 0 ? (
                <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    No classes have been assigned to you yet for this week.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {classTimetables.map((ct) => (
                        <div key={ct.class_id} className="card">
                            <div className="card-header">
                                <h3>📚 Timetable - {ct.class_name}</h3>
                            </div>
                            <div style={{ overflowX: "auto", padding: "1rem" }}>
                                <table className="table timetable-table" style={{ minWidth: "800px", borderCollapse: "collapse", width: "100%" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: "120px", borderBottom: "2px solid #e5e7eb", padding: "10px" }}>Time</th>
                                            {DAYS_OF_WEEK.map(day => (
                                                <th key={day} style={{ textAlign: "center", background: '#f8fafc', borderRadius: '4px', borderBottom: "2px solid #e5e7eb", padding: "10px" }}>{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slots.map((slot, idx) => (
                                            <tr key={slot.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                <td className="time-slot-label" style={{ padding: "10px", verticalAlign: "middle" }}>
                                                    <strong>Period {idx + 1}</strong>
                                                    <br />
                                                    <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                                                </td>
                                                {DAYS_OF_WEEK.map(day => {
                                                    const entry = ct.data.find(t => t.slot_id === slot.id && t.day_of_week === day);

                                                    // Check if this entry is taught by the current faculty
                                                    const isMySubject = myTimetable.some(myT => myT.id === entry?.id);

                                                    let pillStyle = {
                                                        backgroundColor: 'transparent',
                                                        border: '1px dashed var(--border-color)',
                                                        color: 'var(--text-muted)',
                                                        padding: "8px",
                                                        borderRadius: "6px",
                                                        textAlign: "center",
                                                        height: "100%",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        minHeight: "60px"
                                                    };

                                                    if (entry) {
                                                        if (isMySubject) {
                                                            pillStyle = {
                                                                ...pillStyle,
                                                                backgroundColor: "#4f46e5",
                                                                color: "white",
                                                                border: "none",
                                                                boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.4)"
                                                            };
                                                        } else {
                                                            pillStyle = {
                                                                ...pillStyle,
                                                                backgroundColor: "#f3f4f6",
                                                                color: "#374151",
                                                                border: "1px solid #e5e7eb"
                                                            };
                                                        }
                                                    }

                                                    return (
                                                        <td key={`${slot.id}-${day}`} style={{ padding: "10px", verticalAlign: "middle" }}>
                                                            {entry ? (
                                                                <div style={pillStyle}>
                                                                    <strong style={{ fontSize: "0.95rem" }}>{entry.Subject?.name || "N/A"}</strong>
                                                                    {entry.Faculty?.User && !isMySubject && (
                                                                        <small style={{ marginTop: '2px', opacity: 0.8, fontSize: "0.75rem" }}>
                                                                            {entry.Faculty.User.name}
                                                                        </small>
                                                                    )}
                                                                    {isMySubject && (
                                                                        <small style={{ marginTop: '2px', opacity: 0.9, fontSize: "0.75rem", fontWeight: "bold" }}>
                                                                            (Your Class)
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div style={pillStyle}>
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FacultySchedule;
