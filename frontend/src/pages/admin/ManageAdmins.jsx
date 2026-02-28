import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import ThemeSelector from "../../components/ThemeSelector";
import "./ManageAdmins.css";
import "./Dashboard.css";

function ManageAdmins() {
    const { user } = useContext(AuthContext); // Current user
    const navigate = useNavigate();

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // "add" or "upgrade"
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: ""
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/admins");
            setAdmins(response.data.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching admins:", err);
            setError("Failed to load admins.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setFormErrors({ ...formErrors, [name]: "" });
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Name is required";
        if (!formData.email.trim()) errors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format";
        if (!formData.password) errors.password = "Password is required";
        else if (formData.password.length < 6) errors.password = "Password must be at least 6 characters";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setSubmitting(true);
            const response = await api.post("/admin/admins", formData);

            if (response.data.success) {
                // Success!
                setAdmins([...admins, response.data.data]);
                setShowModal(false);
                setFormData({ name: "", email: "", phone: "", password: "" });
                alert("Admin added successfully!");
                // Refresh list to be sure
                fetchAdmins();
            }
        } catch (err) {
            console.error("Error adding admin:", err);
            if (err.response && err.response.status === 403) {
                // Plan limit reached!
                setShowModal(false); // Close add form
                setModalMode("upgrade"); // Prepare upgrade modal content (handled in render)
                alert(err.response.data.message); // Show simple alert for now
                // Optionally show a specific upgrade modal here if designed
            } else {
                setFormErrors({ ...formErrors, general: err.response?.data?.message || "Failed to add admin." });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm("Are you sure you want to remove this admin? This action cannot be undone.")) return;

        try {
            await api.delete(`/admin/admins/${id}`);
            setAdmins(admins.filter(a => a.id !== id));
        } catch (err) {
            console.error("Error deleting admin:", err);
            alert(err.response?.data?.message || "Failed to delete admin.");
        }
    };

    if (loading) return <div className="manage-admins-container">Loading admins...</div>;

    return (
        <div className="manage-admins-container dashboard-container">
            <header className="page-header dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem' }}>👑</span> Manage Admins
                    </h1>
                    <p>Add and manage additional administrators for your institute.</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <Link to="/admin/dashboard" className="btn btn-secondary">← Back</Link>
                    <button
                        className="btn btn-primary btn-animated"
                        onClick={() => { setShowModal(true); setModalMode("add"); }}>
                        + Add New Admin
                    </button>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="admins-grid">
                {admins.map(admin => (
                    <div key={admin.id} className="admin-card card">
                        <div className="admin-info">
                            <h3>{admin.name} {admin.id === user?.id && <span style={{ fontSize: '0.8em', color: '#6b7280' }}>(You)</span>}</h3>
                            <p><strong>Email:</strong> {admin.email}</p>
                            <p><strong>Phone:</strong> {admin.phone || "N/A"}</p>
                            <p><strong>Status:</strong> <span style={{ color: admin.status === 'active' ? 'green' : 'red' }}>{admin.status}</span></p>
                            <p><strong>Joined:</strong> {new Date(admin.created_at).toLocaleDateString()}</p>
                        </div>

                        {admin.id !== user?.id && (
                            <div className="admin-actions">
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                >
                                    Remove Access
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Models */}
            {showModal && modalMode === "add" && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add New Administrator</h2>
                        <form onSubmit={handleAddAdmin}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                />
                                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@institute.com"
                                />
                                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="9876543210"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="******"
                                />
                                {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                            </div>

                            {formErrors.general && <div className="error-message" style={{ marginBottom: '1rem' }}>{formErrors.general}</div>}

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? "Creating..." : "Create Admin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageAdmins;
