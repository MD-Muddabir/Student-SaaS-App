/**
 * Classes Management Page
 * Complete CRUD for class management
 */

import { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

function Classes() {
    const { user } = useContext(AuthContext);
    const [classes, setClasses] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        section: "",
    });

    useEffect(() => {
        fetchClasses();
        fetchFaculty();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/classes");
            setClasses(response.data.data || []);
            setTotalCount(response.data.count || 0);
        } catch (error) {
            console.error("Error fetching classes:", error);
        } finally {
            setLoading(false);
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
                await api.put(`/classes/${formData.id}`, formData);
                alert("Class updated successfully");
            } else {
                await api.post("/classes", {
                    ...formData,
                    institute_id: user.institute_id,
                });
                alert("Class created successfully");
            }
            setShowModal(false);
            resetForm();
            fetchClasses();
        } catch (error) {
            alert("Error: " + error.response?.data?.message);
        }
    };

    const handleEdit = (classItem) => {
        setFormData({
            id: classItem.id,
            name: classItem.name,
            section: classItem.section || "",
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this class? This will affect all students in this class.")) return;

        try {
            await api.delete(`/classes/${id}`);
            alert("Class deleted successfully");
            fetchClasses();
        } catch (error) {
            alert("Error deleting class: " + error.response?.data?.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            section: "",
        });
        setEditMode(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const filteredClasses = classes.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.section?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>🏫 Classes Management</h1>
                    <p>Manage classes and sections</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="btn btn-primary"
                >
                    + Add Class
                </button>
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by class name or section..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon">🏫</div>
                    <div className="stat-content">
                        <h3>{totalCount}</h3>
                        <p>Total Classes</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👨‍🎓</div>
                    <div className="stat-content">
                        {/* Calculate total students across all classes */}
                        <h3>
                            {classes.reduce((acc, curr) => acc + (curr.Students?.length || 0), 0)}
                        </h3>
                        <p>Enrolled Students</p>
                    </div>
                </div>
            </div>

            {/* Classes Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {filteredClasses.length === 0 ? (
                    <div className="card" style={{ padding: "2rem", textAlign: "center", gridColumn: "1 / -1" }}>
                        <p>No classes found. Click "Add Class" to create one.</p>
                    </div>
                ) : (
                    filteredClasses.map((classItem) => (
                        <div key={classItem.id} className="card" style={{ padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.5rem", color: "#6366f1" }}>
                                        {classItem.name}
                                    </h3>
                                    {classItem.section && (
                                        <p style={{ margin: "0.25rem 0 0 0", color: "#6b7280" }}>
                                            Section: {classItem.section}
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleEdit(classItem)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(classItem.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1rem", marginTop: "1rem" }}>
                                <div style={{ display: "grid", gap: "0.5rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <strong>Students:</strong>
                                        <span className="badge badge-info">{classItem.Students?.length || 0}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <strong>Subjects:</strong>
                                        <span>{classItem.Subjects?.length || 0}</span>
                                    </div>
                                    <div style={{ fontSize: "0.875rem", color: "#9ca3af", marginTop: "0.5rem" }}>
                                        Created: {new Date(classItem.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Class Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <h3>{editMode ? "Edit Class" : "Add New Class"}</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-sm">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Class Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="e.g., Class 10, Grade 5, BSc 1st Year"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    <small style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                                        Must be unique for your institute
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Section (Optional)</label>
                                    <input
                                        type="text"
                                        name="section"
                                        className="form-input"
                                        placeholder="e.g., A, B, Science, Commerce"
                                        value={formData.section}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? "Update Class" : "Create Class"}
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

export default Classes;
