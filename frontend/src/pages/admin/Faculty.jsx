/**
 * Faculty Management Page
 * Complete CRUD for faculty management
 */

import { useState, useEffect, useContext } from "react";
import ThemeSelector from "../../components/ThemeSelector";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

function Faculty() {
    const { user } = useContext(AuthContext);
    const [faculty, setFaculty] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        designation: "",
        salary: "",
        join_date: "",
    });

    useEffect(() => {
        fetchFaculty();
        fetchClasses();
        fetchSubjects();
    }, []);

    const hasPerm = (op) => {
        if (user?.role === 'admin' || user?.role === 'super_admin') return true;
        if (user?.role === 'manager' && user?.permissions) {
            return user.permissions.includes('faculty') || user.permissions.includes(`faculty.${op}`);
        }
        return false;
    };
    const canCreate = hasPerm('create');
    const canUpdate = hasPerm('update');
    const canDelete = hasPerm('delete');

    const fetchFaculty = async () => {
        try {
            const response = await api.get("/faculty");
            setFaculty(response.data.data || []);
            setTotalCount(response.data.count || 0);
        } catch (error) {
            console.error("Error fetching faculty:", error);
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

    const fetchSubjects = async () => {
        try {
            const response = await api.get("/subjects");
            setSubjects(response.data.data || []);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/faculty/${formData.id}`, formData);
                alert("Faculty updated successfully");
            } else {
                await api.post("/faculty", {
                    ...formData,
                    institute_id: user.institute_id,
                });
                alert("Faculty added successfully");
            }
            setShowModal(false);
            resetForm();
            fetchFaculty();
        } catch (error) {
            alert("Error: " + error.response?.data?.message);
        }
    };

    const handleEdit = (facultyMember) => {
        setFormData({
            id: facultyMember.id,
            name: facultyMember.User?.name || "",
            email: facultyMember.User?.email || "",
            phone: facultyMember.User?.phone || "",
            password: "",
            designation: facultyMember.designation || "",
            salary: facultyMember.salary || "",
            join_date: facultyMember.join_date || "",
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this faculty member?")) return;

        try {
            await api.delete(`/faculty/${id}`);
            alert("Faculty deleted successfully");
            fetchFaculty();
        } catch (error) {
            alert("Error deleting faculty: " + error.response?.data?.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            password: "",
            designation: "",
            salary: "",
            join_date: "",
        });
        setEditMode(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const filteredFaculty = faculty.filter(
        (f) =>
            f.User?.name.toLowerCase().includes(search.toLowerCase()) ||
            f.User?.email.toLowerCase().includes(search.toLowerCase()) ||
            f.designation?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', lineHeight: 1 }}>👩‍🏫</span>
                        Faculty Management
                    </h1>
                    <p>Manage faculty members</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                    {canCreate && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn btn-primary btn-animated"
                        >
                            + Add Faculty
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name, email, or designation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon">👩‍🏫</div>
                    <div className="stat-content">
                        <h3>{totalCount}</h3>
                        <p>Total Faculty</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{faculty.filter((f) => f.User?.status === "active").length}</h3>
                        <p>Active</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                        <h3>{subjects.length}</h3>
                        <p>Total Subjects</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏫</div>
                    <div className="stat-content">
                        <h3>{classes.length}</h3>
                        <p>Total Classes</p>
                    </div>
                </div>
            </div>

            {/* Faculty Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Faculty ({filteredFaculty.length})</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Designation</th>
                                <th>Salary</th>
                                <th>Join Date</th>
                                <th>Teaching Details</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFaculty.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", padding: "2rem" }}>
                                        No faculty found
                                    </td>
                                </tr>
                            ) : (
                                filteredFaculty.map((facultyMember) => (
                                    <tr key={facultyMember.id}>
                                        <td>{facultyMember.id}</td>
                                        <td>{facultyMember.User?.name}</td>
                                        <td>{facultyMember.User?.email}</td>
                                        <td>{facultyMember.User?.phone || "N/A"}</td>
                                        <td>{facultyMember.designation || "N/A"}</td>
                                        <td>₹{facultyMember.salary || "N/A"}</td>
                                        <td>
                                            {facultyMember.join_date
                                                ? new Date(facultyMember.join_date).toLocaleDateString()
                                                : "N/A"}
                                        </td>
                                        <td>
                                            {facultyMember.Subjects && facultyMember.Subjects.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {facultyMember.Subjects.map((sub) => (
                                                        <span key={sub.id} style={{ color: "#e2e8f0", fontSize: '0.75rem', padding: '4px 4px', fontWeight: '500' }}>
                                                            {sub.Class?.name}{sub.Class?.section ? ` (${sub.Class.section})` : ''} : {sub.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: "0.85rem", color: "#888", fontStyle: "italic" }}>
                                                    No subjects assigned
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge-${facultyMember.User?.status === "active" ? "success" : "danger"
                                                    }`}
                                            >
                                                {facultyMember.User?.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                {canUpdate && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleEdit(facultyMember)}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(facultyMember.id)}
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

                {/* ── MOBILE CARD LIST (shown on mobile via responsive.css) ── */}
                <div className="admin-mobile-cards card-stagger">
                    {filteredFaculty.length === 0 ? (
                        <div className="empty-state-mobile">
                            <div className="empty-icon">👩‍🏫</div>
                            <div className="empty-title">No Faculty Found</div>
                            <div className="empty-desc">No faculty members match your search.</div>
                        </div>
                    ) : (
                        filteredFaculty.map((fm) => (
                            <div key={fm.id} className="admin-item-card" style={{ borderLeftColor: '#10b981' }}>
                                <div className="aic-info">
                                    <div className="aic-name">
                                        {fm.User?.name}
                                        <span className="aic-badge">
                                            <span className={`badge badge-${fm.User?.status === 'active' ? 'success' : 'danger'}`}>
                                                {fm.User?.status}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="aic-sub">{fm.User?.email} · {fm.designation || 'Faculty'}</div>
                                    <div className="aic-sub">
                                        {fm.Subjects?.length > 0
                                            ? fm.Subjects.map(s => `${s.Class?.name ? s.Class.name + ': ' : ''}${s.name}`).join(' · ')
                                            : 'No subjects assigned'}
                                    </div>
                                </div>
                                <div className="aic-actions">
                                    {canUpdate && (
                                        <button className="btn btn-sm btn-primary" onClick={() => handleEdit(fm)}>Edit</button>
                                    )}
                                    {canDelete && (
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(fm.id)}>Del</button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Add/Edit Faculty Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
                        <div className="modal-header">
                            <h3>{editMode ? "Edit Faculty" : "Add New Faculty"}</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-sm">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        disabled={editMode}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        placeholder="9876543210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>

                                {!editMode && (
                                    <div className="form-group">
                                        <label className="form-label">Password *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            className="form-input"
                                            placeholder="Minimum 6 characters"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required={!editMode}
                                            minLength={6}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input
                                        type="text"
                                        name="designation"
                                        className="form-input"
                                        placeholder="e.g., Senior Teacher, HOD"
                                        value={formData.designation}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Salary (₹)</label>
                                    <input
                                        type="number"
                                        name="salary"
                                        className="form-input"
                                        placeholder="30000"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Join Date</label>
                                    <input
                                        type="date"
                                        name="join_date"
                                        className="form-input"
                                        value={formData.join_date}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? "Update Faculty" : "Add Faculty"}
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

export default Faculty;

