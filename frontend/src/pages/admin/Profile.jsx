import { useNavigate } from "react-router-dom";
import "../admin/Dashboard.css";
import ThemeSelector from "../../components/ThemeSelector";

function Profile() {
    const navigate = useNavigate();
    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Profile</h1>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => navigate(-1)} className="btn btn-secondary">
                        ← Back
                    </button>
                </div>
            </div>
            <div className="card">
                <p>Coming soon...</p>
            </div>
        </div>
    );
}
export default Profile;
