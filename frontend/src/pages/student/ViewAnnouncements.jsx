import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../admin/Dashboard.css";

function ViewAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await api.get("/announcements");
                setAnnouncements(response.data.data.announcements || []);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching announcements:", err);
                setError("Failed to load announcements.");
                setLoading(false);
            }
        };

        const markAsViewed = async () => {
            try {
                await api.post("/announcements/viewed");
            } catch (err) {
                console.error(err);
            }
        };

        fetchAnnouncements();
        markAsViewed();
    }, []);

    if (loading) return <div className="dashboard-container">Loading announcements...</div>;
    if (error) return <div className="dashboard-container" style={{ color: "red" }}>{error}</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📢 Institute Announcements</h1>
                    <p>Stay updated with the latest news</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/student/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recent Updates</h3>
                </div>
                <div style={{ padding: "20px" }}>
                    {announcements.length === 0 ? (
                        <p style={{ textAlign: "center", padding: "1rem" }}>No announcements available.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {announcements.map((ann) => (
                                <div key={ann.id} className="card announcement-card" style={{ padding: "1.5rem" }}>
                                    <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: "700" }}>{ann.title}</h4>
                                    <p style={{ margin: "0 0 1rem 0", opacity: "0.85" }}>{ann.content}</p>
                                    <div style={{ fontSize: "0.85rem", opacity: "0.7", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                                        <span>Target Audience: <strong style={{ textTransform: "capitalize", opacity: "1" }}>{ann.target_audience}</strong></span>
                                        <span>Published: {new Date(ann.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewAnnouncements;
