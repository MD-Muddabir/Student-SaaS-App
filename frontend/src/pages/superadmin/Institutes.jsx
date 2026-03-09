/**
 * Super Admin - Institutes Management
 * Complete CRUD for managing all institutes
 */

import { useState, useEffect } from "react";
import api from "../../services/api";
import BackButton from "../../components/common/BackButton";
import ThemeSelector from "../../components/ThemeSelector";
import "../admin/Dashboard.css";

function Institutes() {
    const [institutes, setInstitutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showModal, setShowModal] = useState(false);
    const [selectedInstitute, setSelectedInstitute] = useState(null);

    useEffect(() => {
        fetchInstitutes();
    }, [statusFilter]);

    const fetchInstitutes = async () => {
        try {
            let url = "/institutes?limit=100";
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }
            const response = await api.get(url);
            setInstitutes(response.data.data?.institutes || []);
        } catch (error) {
            console.error("Error fetching institutes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (id) => {
        if (!window.confirm("Are you sure you want to suspend this institute?")) return;

        try {
            await api.patch(`/institutes/${id}/status`, { status: "suspended" });
            alert("Institute suspended successfully");
            fetchInstitutes();
        } catch (error) {
            alert("Error suspending institute: " + error.response?.data?.message);
        }
    };

    const handleActivate = async (id) => {
        try {
            await api.patch(`/institutes/${id}/status`, { status: "active" });
            alert("Institute activated successfully");
            fetchInstitutes();
        } catch (error) {
            alert("Error activating institute: " + error.response?.data?.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ WARNING: This will delete the institute and ALL its data (students, faculty, etc.). Are you sure?")) return;

        try {
            await api.delete(`/institutes/${id}`);
            alert("Institute deleted successfully");
            fetchInstitutes();
        } catch (error) {
            alert("Error deleting institute: " + error.response?.data?.message);
        }
    };

    const handleViewDetails = (institute) => {
        setSelectedInstitute(institute);
        setShowModal(true);
    };

    const filteredInstitutes = institutes.filter(inst =>
        (inst.name && inst.name.toLowerCase().includes(search.toLowerCase())) ||
        (inst.email && inst.email.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>🏢 Institutes Management</h1>
                    <p>Manage all registered institutes</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <BackButton />
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: "1", minWidth: "250px" }}
                    />
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ minWidth: "150px" }}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-content">
                        <h3>{institutes.length}</h3>
                        <p>Total Institutes</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{institutes.filter(i => i.status === 'active').length}</h3>
                        <p>Active</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏸️</div>
                    <div className="stat-content">
                        <h3>{institutes.filter(i => i.status === 'suspended').length}</h3>
                        <p>Suspended</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-content">
                        <h3>{institutes.filter(i => i.status === 'expired').length}</h3>
                        <p>Expired</p>
                    </div>
                </div>
            </div>

            {/* Institutes Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Institutes ({filteredInstitutes.length})</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>End Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInstitutes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                                        No institutes found
                                    </td>
                                </tr>
                            ) : (
                                filteredInstitutes.map((institute) => (
                                    <tr key={institute.id}>
                                        <td>{institute.name}</td>
                                        <td>{institute.email}</td>
                                        <td>{institute.phone || "N/A"}</td>
                                        <td>{institute.Plan?.name || "No Plan"}</td>
                                        <td>
                                            <span className={`badge badge-${institute.status === 'active' ? 'success' :
                                                institute.status === 'suspended' ? 'warning' : 'danger'
                                                }`}>
                                                {institute.status}
                                            </span>
                                        </td>
                                        <td>
                                            {institute.subscription_end
                                                ? new Date(institute.subscription_end).toLocaleDateString()
                                                : "N/A"}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleViewDetails(institute)}
                                                >
                                                    View
                                                </button>
                                                {institute.status === 'active' ? (
                                                    <button
                                                        className="btn btn-sm btn-warning"
                                                        onClick={() => handleSuspend(institute.id)}
                                                    >
                                                        Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleActivate(institute.id)}
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(institute.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Institute Details Modal */}
            {showModal && selectedInstitute && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", background: "white", padding: "2rem", borderRadius: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.5rem" }}>Institute Details</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
                        </div>
                        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>ID</label>
                                <span>{selectedInstitute.id}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Name</label>
                                <span>{selectedInstitute.name}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Email</label>
                                <span>{selectedInstitute.email}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Phone</label>
                                <span>{selectedInstitute.phone || "Not provided"}</span>
                            </div>
                            <div className="detail-item" style={{ gridColumn: "1/-1" }}>
                                <label style={{ fontWeight: "bold", display: "block" }}>Address</label>
                                <span>{selectedInstitute.address || "Not provided"}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Plan</label>
                                <span>{selectedInstitute.Plan?.name || "No Plan"}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Status</label>
                                <span>{selectedInstitute.status}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Subscription Start</label>
                                <span>{selectedInstitute.subscription_start ? new Date(selectedInstitute.subscription_start).toLocaleDateString() : "N/A"}</span>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontWeight: "bold", display: "block" }}>Subscription End</label>
                                <span>{selectedInstitute.subscription_end ? new Date(selectedInstitute.subscription_end).toLocaleDateString() : "N/A"}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: "2rem", textAlign: "right" }}>
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Institutes;
