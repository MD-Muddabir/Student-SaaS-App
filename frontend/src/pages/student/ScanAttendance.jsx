import React, { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../admin/Dashboard.css";

function ScanAttendance() {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [enrolledSubjects, setEnrolledSubjects] = useState([]);
    const [studentData, setStudentData] = useState(null);

    useEffect(() => {
        fetchStudentData();
    }, []);

    const fetchStudentData = async () => {
        try {
            // First fetch profile to get actual student ID and details
            const profileRes = await api.get("/students/me");
            const data = profileRes.data.data;
            setStudentData(data);

            // Check if student has subjects
            if (data && (data.Classes?.length > 0 || data.Subjects?.length > 0 || data.is_full_course)) {
                setEnrolledSubjects(data.Subjects?.length > 0 ? data.Subjects : data.Classes || []);
            }
        } catch (error) {
            console.error("Error fetching student profile:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    // Unqiue Static QR code value based on Student ID.
    // Faculty will scan this QR code.
    const qrValue = studentData ? `STUDENT_QR_${studentData.id}` : "";

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>🤳 My Attendance QR Code</h1>
                    <p>Show this static QR code to your faculty to mark attendance.</p>
                </div>
                <Link to="/student/dashboard" className="btn btn-secondary">
                    ← Back
                </Link>
            </div>

            <div className="card" style={{ padding: "3rem", maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
                {enrolledSubjects.length === 0 ? (
                    <div style={{ backgroundColor: "#fef2f2", padding: "2rem", borderRadius: "12px", border: "1px solid #ef4444" }}>
                        <h2 style={{ color: "#991b1b", marginBottom: "1rem" }}>🚫 Not Enrolled</h2>
                        <p style={{ color: "#7f1d1d", fontSize: "1.1rem" }}>
                            You are not enrolled in any subjects. Your QR Code cannot be generated until you are assigned to a class/subject.
                        </p>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ marginBottom: "1.5rem", color: "#1f2937" }}>Your Unique ID Code</h2>
                        <div style={{
                            background: "white",
                            padding: "1.5rem",
                            borderRadius: "16px",
                            display: "inline-block",
                            border: "2px solid #e5e7eb",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                        }}>
                            <QRCodeSVG
                                value={qrValue}
                                size={250}
                                level={"H"}
                                includeMargin={true}
                            />
                        </div>
                        <p style={{ marginTop: "1.5rem", color: "#4b5563", fontSize: "1.1rem", fontWeight: "bold" }}>
                            {studentData?.User?.name || user?.name}
                        </p>
                        <p style={{ marginTop: "0.5rem", color: "#6b7280", fontSize: "0.95rem" }}>
                            This QR code is common for all your subjects and will not change. You can print it or show it directly from your device.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ScanAttendance;
