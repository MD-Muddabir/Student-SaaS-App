import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Dashboard.css"; // Reuse dashboard UI
import "../../components/common/Buttons.css";

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function AdminTimetable() {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [slots, setSlots] = useState([]);
    const [timetable, setTimetable] = useState([]);

    const [selectedClass, setSelectedClass] = useState("");

    // Modal States
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [showEntryModal, setShowEntryModal] = useState(false);

    // Form States
    const [slotForm, setSlotForm] = useState({ start_time: "", end_time: "" });
    const [entryForm, setEntryForm] = useState({
        day_of_week: "Monday",
        slot_id: "",
        subject_id: "",
        faculty_id: "",
        room_number: ""
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchTimetable(selectedClass);
        } else {
            setTimetable([]);
        }
    }, [selectedClass]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [classesRes, subjectsRes, facultyRes, slotsRes] = await Promise.all([
                api.get("/classes"),
                api.get("/subjects"), // Requires an endpoint that fetches all subjects
                api.get("/faculty"),
                api.get("/timetable/slots")
            ]);

            setClasses(classesRes.data.data || []);
            setSubjects(subjectsRes.data.data || []);
            setFaculty(facultyRes.data.data || []);
            setSlots(slotsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching initial data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimetable = async (classId) => {
        try {
            const response = await api.get(`/timetable/class/${classId}`);
            setTimetable(response.data.data || []);
        } catch (error) {
            console.error("Error fetching timetable", error);
        }
    };

    // --- SLOT LOGIC ---
    const handleSlotSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/timetable/slots", slotForm);
            if (res.data.success) {
                alert("Time Slot added successfully!");
                setSlots([...slots, res.data.data]);
                setShowSlotModal(false);
                setSlotForm({ start_time: "", end_time: "" });
            }
        } catch (error) {
            console.error("Error adding slot:", error);
            alert("Failed to add slot.");
        }
    };

    const handleDeleteSlot = async (id) => {
        if (!window.confirm("Are you sure? This will delete the time slot.")) return;
        try {
            const res = await api.delete(`/timetable/slots/${id}`);
            if (res.data.success) {
                setSlots(slots.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error("Error deleting slot:", error);
            alert(error.response?.data?.message || "Failed to delete slot.");
        }
    };

    // --- ENTRY LOGIC ---
    const handleEntrySubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/timetable", {
                ...entryForm,
                class_id: selectedClass
            });
            if (res.data.success) {
                alert("Timetable entry added!");
                fetchTimetable(selectedClass);
                setShowEntryModal(false);
            }
        } catch (error) {
            console.error("Error adding entry:", error);
            alert(error.response?.data?.message || "Failed to add timetable entry.");
        }
    };

    const handleDeleteEntry = async (id) => {
        if (!window.confirm("Delete this timetable entry?")) return;
        try {
            const res = await api.delete(`/timetable/${id}`);
            if (res.data.success) {
                setTimetable(timetable.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error("Error deleting entry:", error);
            alert("Failed to delete entry.");
        }
    };

    if (loading) {
        return <div className="dashboard-container">Loading Timetable...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📅 Weekly Timetable</h1>
                    <p>Class schedule management</p>
                </div>
                <div className="dashboard-header-right" style={{ display: 'flex', gap: '10px' }}>
                    <button className="animated-btn secondary" onClick={() => setShowSlotModal(true)}>
                        <span className="icon">⏱️</span> Manage Time Slots
                    </button>
                    <button className="animated-btn primary" onClick={() => {
                        if (!selectedClass) {
                            alert("Please select a class first!");
                            return;
                        }
                        setShowEntryModal(true);
                    }}>
                        <span className="icon">➕</span> Assign Subject
                    </button>
                </div>
            </div>

            <div className="filter-container" style={{ marginBottom: "2rem" }}>
                <span className="filter-label">Select Class Schedule:</span>
                <select
                    className="form-select"
                    style={{ width: "250px", margin: 0 }}
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                >
                    <option value="">-- Choose Class --</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name} {cls.section ? `- ${cls.section}` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {selectedClass ? (
                slots.length === 0 ? (
                    <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
                        <h3>No Time Slots Available</h3>
                        <p style={{ color: "var(--text-secondary)" }}>Please create time slots first before assigning subjects to the timetable.</p>
                    </div>
                ) : (
                    <div className="card" style={{ overflowX: "auto" }}>
                        <table className="table timetable-table" style={{ minWidth: "800px" }}>
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

                                            // Determine pill color consistently by subject ID or fallback to standard array loop
                                            let colorClass = "pill-color-0";
                                            if (entry && entry.subject_id) {
                                                colorClass = `pill-color-${entry.subject_id % 7}`;
                                            }

                                            return (
                                                <td key={`${slot.id}-${day}`}>
                                                    {entry ? (
                                                        <div className={`timetable-pill ${colorClass}`}>
                                                            <span>{entry.Subject?.name}</span>
                                                            <button
                                                                onClick={() => handleDeleteEntry(entry.id)}
                                                                style={{ position: "absolute", top: "2px", right: "2px", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1rem", opacity: 0.5 }}
                                                                title="Remove"
                                                            >
                                                                ×
                                                            </button>
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
                )
            ) : (
                <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    Select a class from the dropdown above to view or construct its timetable.
                </div>
            )}

            {/* Time Slot Modal */}
            {showSlotModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>Manage Time Slots</h2>

                        <div style={{ marginBottom: "2rem" }}>
                            <h4>Existing Slots</h4>
                            {slots.length === 0 ? <p>No slots defined yet.</p> : (
                                <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
                                    {slots.map(s => (
                                        <li key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", borderBottom: "1px solid var(--border-color)" }}>
                                            <span>{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
                                            <button onClick={() => handleDeleteSlot(s.id)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <form onSubmit={handleSlotSubmit} className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Start Time</label>
                                <input type="time" className="form-input" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Time</label>
                                <input type="time" className="form-input" value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} required />
                            </div>
                            <div className="form-actions" style={{ gridColumn: "1 / -1", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSlotModal(false)}>Close</button>
                                <button type="submit" className="btn btn-primary">Add Time Slot</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Entry Assignment Modal */}
            {showEntryModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>Assign Subject to Timetable</h2>

                        <form onSubmit={handleEntrySubmit} className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Day of Week</label>
                                <select className="form-select" value={entryForm.day_of_week} onChange={(e) => setEntryForm({ ...entryForm, day_of_week: e.target.value })} required>
                                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Time Slot</label>
                                <select className="form-select" value={entryForm.slot_id} onChange={(e) => setEntryForm({ ...entryForm, slot_id: e.target.value })} required>
                                    <option value="">-- Choose Time --</option>
                                    {slots.map(s => <option key={s.id} value={s.id}>{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                <label className="form-label">Subject</label>
                                <select className="form-select" value={entryForm.subject_id} onChange={(e) => {
                                    const subjectId = e.target.value;
                                    const selectedSubject = subjects.find(s => s.id.toString() === subjectId);
                                    let autoFacultyId = entryForm.faculty_id;
                                    if (selectedSubject && selectedSubject.faculty_id) {
                                        autoFacultyId = selectedSubject.faculty_id;
                                    }
                                    setEntryForm({ ...entryForm, subject_id: subjectId, faculty_id: autoFacultyId });
                                }} required>
                                    <option value="">-- Select Subject --</option>
                                    {subjects.filter(sub => sub.class_id.toString() === selectedClass.toString()).map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                <label className="form-label">Faculty</label>
                                <select className="form-select" value={entryForm.faculty_id} onChange={(e) => setEntryForm({ ...entryForm, faculty_id: e.target.value })} required>
                                    <option value="">-- Select Faculty --</option>
                                    {faculty.map(f => <option key={f.id} value={f.id}>{f.User?.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                <label className="form-label">Room Number (Optional)</label>
                                <input type="text" className="form-input" placeholder="e.g. 101" value={entryForm.room_number} onChange={(e) => setEntryForm({ ...entryForm, room_number: e.target.value })} />
                            </div>

                            <div className="form-actions" style={{ gridColumn: "1 / -1", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEntryModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Assign Class</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminTimetable;
