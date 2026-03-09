import { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { Html5Qrcode } from "html5-qrcode";
import "./Dashboard.css";

function FacultyAttendance() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [message, setMessage] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const isProcessed = useRef(false);
    const qrCodeRef = useRef(null);
    const isScannerRunning = useRef(false);

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const startScanningProcess = async () => {
        setIsScanning(true);
        setMessage(null);
        setCameraError(null);
        isProcessed.current = false;

        // Add small delay to let UI render the video element
        setTimeout(() => {
            startScanner();
        }, 300);
    };

    const stopScanningProcess = async () => {
        setIsScanning(false);
        setMessage(null);
        await stopScanner();
    };

    const startScanner = async () => {
        try {
            if (qrCodeRef.current && isScannerRunning.current) {
                await stopScanner();
            }

            const html5QrCode = new Html5Qrcode("admin-faculty-qr-reader");
            qrCodeRef.current = html5QrCode;

            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                setCameraError("No camera found on this device.");
                return;
            }

            // Prefer back camera
            const cameraId = cameras.find(c => c.label.toLowerCase().includes("back"))?.id || cameras[0].id;

            await html5QrCode.start(
                cameraId,
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                (decodedText) => {
                    if (isProcessed.current) return;
                    isProcessed.current = true;
                    stopScanner();
                    markFacultyAttendance(decodedText);
                },
                () => { /* ignore frame errors */ }
            );
            isScannerRunning.current = true;
        } catch (err) {
            console.error("Camera Error:", err);
            setCameraError("Could not access camera. Please allow camera permissions and try again.");
        }
    };

    const stopScanner = async () => {
        try {
            if (qrCodeRef.current && isScannerRunning.current) {
                await qrCodeRef.current.stop();
                isScannerRunning.current = false;
            }
        } catch (e) {
            // ignore
        }
    };

    const markFacultyAttendance = async (decodedQR) => {
        try {
            setMessage({ type: "loading", text: "Marking faculty attendance..." });

            const response = await api.post("/faculty-attendance/mark-by-qr", {
                qr_code: decodedQR
            });

            if (response.data.success) {
                setMessage({ type: "success", text: response.data.message });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to mark attendance";
            let type = "error";
            if (error.response?.status === 400 && errorMsg.includes("already marked")) {
                type = "warning";
            }
            setMessage({ type: type, text: errorMsg });
        }
    };

    const handleScanAnother = async () => {
        setMessage(null);
        isProcessed.current = false;
        await startScanner();
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1>📸 Scan Faculty QR</h1>
                    <p>Scan a faculty member's QR code to mark their daily attendance.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/admin/view-faculty-attendance" className="btn btn-primary" style={{ backgroundColor: "#4f46e5" }}>
                        📊 View Tracker
                    </Link>
                    <button className="btn btn-secondary" onClick={() => navigate("/admin/dashboard")}>
                        ← Back
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
                {!isScanning ? (
                    <div>
                        <h2 style={{ marginBottom: "1rem" }}>Mark Presence</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                            Click below to open your camera and scan the static QR code shown by the faculty.
                        </p>
                        <button
                            className="btn btn-primary btn-animated"
                            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
                            onClick={startScanningProcess}
                        >
                            📸 Open Camera Scanner
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ padding: "1rem", backgroundColor: "#ecfdf5", color: "#065f46", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #10b981" }}>
                            <h2 style={{ margin: 0 }}>🟢 Scanning Active</h2>
                        </div>

                        {cameraError ? (
                            <div style={{ padding: "2rem", background: "#fef2f2", color: "#991b1b", border: "1px solid #ef4444", borderRadius: "12px", marginBottom: "2rem" }}>
                                <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>📵 {cameraError}</p>
                            </div>
                        ) : !message ? (
                            <div>
                                <h3 style={{ marginBottom: "1rem" }}>Point camera at Faculty QR</h3>
                                <div
                                    id="admin-faculty-qr-reader"
                                    style={{
                                        width: "100%",
                                        maxWidth: "400px",
                                        margin: "0 auto",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        border: "3px solid #6366f1",
                                        aspectRatio: "1 / 1"
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{
                                padding: "2.5rem",
                                backgroundColor: message.type === "success" ? "#ecfdf5" : message.type === "warning" ? "#fffbeb" : "#fef2f2",
                                borderRadius: "12px",
                                border: `2px solid ${message.type === "success" ? "#10b981" : message.type === "warning" ? "#f59e0b" : "#ef4444"}`
                            }}>
                                <h2 style={{ color: message.type === "success" ? "#065f46" : message.type === "warning" ? "#b45309" : "#991b1b", margin: 0, marginBottom: "1rem" }}>
                                    {message.text}
                                </h2>
                                {message.type !== "loading" && (
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: "0.75rem 2rem", fontSize: "1rem", marginTop: "1rem" }}
                                        onClick={handleScanAnother}
                                    >
                                        🔄 Scan Next Faculty
                                    </button>
                                )}
                            </div>
                        )}

                        <button
                            className="btn btn-danger"
                            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "2rem" }}
                            onClick={stopScanningProcess}
                        >
                            🛑 Stop Scanning
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FacultyAttendance;
