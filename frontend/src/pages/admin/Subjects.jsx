/**
 * Subjects Management Page
 * Complete CRUD for subject management with faculty and class assignment
 */

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import ThemeSelector from "../../components/ThemeSelector";
import "./Dashboard.css";

function Subjects() {
    const { user } = useContext(AuthContext);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("all");

    const [formData, setFormData] = useState({
        name: "",
        class_id: "",
        faculty_id: "",
    });

    useEffect(() => {
        fetchSubjects();
        fetchClasses();
        fetchFaculty();
    }, []);

    const hasPerm = (op) => {
        if (user?.role === 'admin' || user?.role === 'super_admin') return true;
        if (user?.role === 'manager' && user?.permissions) {
            return user.permissions.includes('subjects') || user.permissions.includes(`subjects.${op}`);
        }
        return false;
    };
    const canCreate = hasPerm('create');
    const canUpdate = hasPerm('update');
    const canDelete = hasPerm('delete');

    const fetchSubjects = async () => {
        try {
            const response = await api.get("/subjects");
            setSubjects(response.data.data || []);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.get("/classes");
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchFaculty = async () => {
        try {
            const response = await api.get("/faculty");
            setFaculty(response.data.data || []);
        } catch (error) {
            console.error("Error fetching faculty:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/subjects/${formData.id}`, formData);
                alert("Subject updated successfully");
            } else {
                const subjectNames = formData.name.split(',').map(name => name.trim()).filter(Boolean);

                if (subjectNames.length === 0) {
                    return alert("Please enter at least one valid subject name");
                }

                // Create dynamically for multiple subjects
                await Promise.all(
                    subjectNames.map(async (name) => {
                        return api.post("/subjects", {
                            ...formData,
                            name: name,
                            institute_id: user.institute_id,
                        });
                    })
                );
                alert(`${subjectNames.length} Subject(s) created successfully`);
            }
            setShowModal(false);
            resetForm();
            fetchSubjects();
        } catch (error) {
            alert("Error: " + error.response?.data?.message);
        }
    };

    const handleEdit = (subject) => {
        setFormData({
            id: subject.id,
            name: subject.name,
            class_id: subject.class_id || "",
            faculty_id: subject.faculty_id || "",
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this subject?")) return;

        try {
            await api.delete(`/subjects/${id}`);
            alert("Subject deleted successfully");
            fetchSubjects();
        } catch (error) {
            alert("Error deleting subject: " + error.response?.data?.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            class_id: "",
            faculty_id: "",
        });
        setEditMode(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const filteredSubjects = subjects.filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchesClass = classFilter === "all" || s.class_id === parseInt(classFilter);
        return matchesSearch && matchesClass;
    });

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📚 Subjects Management</h1>
                    <p>Manage subjects and assign faculty</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                    {canCreate && (
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="btn btn-primary btn-animated"
                        >
                            + Add Subject
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by subject name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: "1", minWidth: "250px" }}
                    />
                    <select
                        className="form-select"
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        style={{ minWidth: "200px" }}
                    >
                        <option value="all">All Classes</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} {c.section && `- ${c.section}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                        <h3>{subjects.length}</h3>
                        <p>Total Subjects</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{subjects.filter((s) => s.faculty_id).length}</h3>
                        <p>Assigned to Faculty</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏫</div>
                    <div className="stat-content">
                        <h3>{classes.length}</h3>
                        <p>Total Classes</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👩‍🏫</div>
                    <div className="stat-content">
                        <h3>{faculty.length}</h3>
                        <p>Total Faculty</p>
                    </div>
                </div>
            </div>

            {/* Subjects Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Subjects ({filteredSubjects.length})</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Subject Name</th>
                                <th>Class</th>
                                <th>Assigned Faculty</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubjects.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                                        No subjects found
                                    </td>
                                </tr>
                            ) : (
                                filteredSubjects.map((subject) => (
                                    <tr key={subject.id}>
                                        <td>{subject.id}</td>
                                        <td>
                                            <strong>{subject.name}</strong>
                                        </td>
                                        <td>
                                            {subject.Class ? (
                                                <>
                                                    {subject.Class.name}
                                                    {subject.Class.section && ` - ${subject.Class.section}`}
                                                </>
                                            ) : (
                                                <span style={{ color: "#6b7280" }}>Not assigned</span>
                                            )}
                                        </td>
                                        <td>
                                            {subject.Faculty?.User?.name ? (
                                                <span className="badge badge-success">
                                                    {subject.Faculty.User.name}
                                                </span>
                                            ) : (
                                                <span className="badge badge-warning">Unassigned</span>
                                            )}
                                        </td>
                                        <td>{new Date(subject.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                {canUpdate && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleEdit(subject)}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(subject.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Subject Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <h3>{editMode ? "Edit Subject" : "Add New Subject"}</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-sm">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Subject Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="e.g., Mathematics, Physics, English (comma separated for multiple)"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Assign to Class *</label>
                                    <select
                                        name="class_id"
                                        className="form-select"
                                        value={formData.class_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.section && `- ${c.section}`}
                                            </option>
                                        ))}
                                    </select>
                                    <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                                        Subject must be unique per class
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Assign Faculty (Optional)</label>
                                    <select
                                        name="faculty_id"
                                        className="form-select"
                                        value={formData.faculty_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Faculty</option>
                                        {faculty.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.User?.name} {f.designation && `(${f.designation})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? "Update Subject" : "Create Subject"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Subjects;
