import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Html5Qrcode } from "html5-qrcode";
import "../admin/Dashboard.css";

function ScanAttendance() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [cameraError, setCameraError] = useState(null);

    const isProcessed = useRef(false);
    const qrCodeRef = useRef(null);
    const isScannerRunning = useRef(false);

    useEffect(() => {
        startScanner();
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        try {
            // Always remove old instance if exists
            if (qrCodeRef.current) {
                await stopScanner();
            }

            const html5QrCode = new Html5Qrcode("qr-reader-region");
            qrCodeRef.current = html5QrCode;

            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                setCameraError("No camera found on this device.");
                return;
            }

            // Prefer back camera (environment) if available
            const cameraId = cameras.find(c => c.label.toLowerCase().includes("back"))?.id || cameras[0].id;

            await html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    if (isProcessed.current) return;
                    isProcessed.current = true;
                    stopScanner();
                    markAttendance(decodedText);
                },
                () => { /* ignore scan errors for each frame */ }
            );
            isScannerRunning.current = true;
        } catch (err) {
            console.error("Scanner start error:", err);
            setCameraError("Could not access camera. Please allow camera permission and reload.");
        }
    };

    const stopScanner = async () => {
        try {
            if (qrCodeRef.current && isScannerRunning.current) {
                await qrCodeRef.current.stop();
                isScannerRunning.current = false;
            }
        } catch (e) {
            // silently ignore cleanup errors
        }
    };

    const getLocalDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const markAttendance = async (token) => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await api.post("/attendance/mark-by-qr", {
                session_token: token,
                date: getLocalDate()
            });
            if (response.data.success) {
                setMessage({ type: "success", text: "✅ " + response.data.message });
            } else {
                setMessage({ type: "error", text: "❌ " + response.data.message });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to mark attendance.";
            let msgType = "error";
            let iconText = "❌ ";
            if (errorMsg.toLowerCase().includes("already marked")) {
                msgType = "warning";
                iconText = "💡 ";
            } else if (error.response?.status === 403) {
                // Not enrolled in this subject
                msgType = "not-enrolled";
                iconText = "🚫 ";
            }
            setMessage({ type: msgType, text: iconText + errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const handleScanAnother = async () => {
        isProcessed.current = false;
        setMessage(null);
        await startScanner();
    };

    const getBorderColor = () => {
        if (!message) return "#6366f1";
        if (message.type === "success") return "#10b981";
        if (message.type === "warning") return "#f59e0b";
        if (message.type === "not-enrolled") return "#f97316";
        return "#ef4444";
    };

    const getBgColor = () => {
        if (!message) return "transparent";
        if (message.type === "success") return "#ecfdf5";
        if (message.type === "warning") return "#fffbeb";
        if (message.type === "not-enrolled") return "#fff7ed";
        return "#fef2f2";
    };

    const getTextColor = () => {
        if (message?.type === "success") return "#065f46";
        if (message?.type === "warning") return "#92400e";
        if (message?.type === "not-enrolled") return "#9a3412";
        return "#991b1b";
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📷 Scan QR Attendance</h1>
                    <p>Scan the QR code displayed by your faculty to mark your attendance.</p>
                </div>
                <Link to="/student/dashboard" className="btn btn-secondary">
                    ← Back
                </Link>
            </div>

            <div className="card" style={{ padding: "2rem", maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
                {cameraError ? (
                    <div style={{ padding: "2rem", backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #ef4444" }}>
                        <h2 style={{ color: "#991b1b", marginBottom: "1rem" }}>📵 Camera Error</h2>
                        <p style={{ color: "#7f1d1d" }}>{cameraError}</p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: "1rem" }}
                            onClick={() => { setCameraError(null); startScanner(); }}
                        >
                            🔄 Retry
                        </button>
                    </div>
                ) : !message ? (
                    <div>
                        <h2 style={{ marginBottom: "1rem", color: "#1f2937" }}>Point camera at QR Code</h2>
                        {/* Single clean camera container — no extra UI from the library */}
                        <div
                            id="qr-reader-region"
                            style={{
                                width: "100%",
                                maxWidth: "400px",
                                margin: "0 auto",
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "3px solid #6366f1",
                                aspectRatio: "1 / 1",
                                background: "#000"
                            }}
                        />
                        {loading && (
                            <p style={{ marginTop: "1rem", color: "#6366f1", fontWeight: "bold", fontSize: "1.1rem" }}>
                                ⏳ Verifying attendance...
                            </p>
                        )}
                        <p style={{ marginTop: "0.75rem", color: "#6b7280", fontSize: "0.9rem" }}>
                            Make sure the QR code is well-lit and within the frame.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        padding: "2.5rem",
                        backgroundColor: getBgColor(),
                        borderRadius: "16px",
                        border: `2px solid ${getBorderColor()}`
                    }}>
                        <h2 style={{ margin: 0, color: getTextColor(), fontSize: "1.5rem" }}>
                            {message.text}
                        </h2>
                        <button
                            className="btn btn-primary"
                            style={{ padding: "0.75rem 2rem", fontSize: "1rem", marginTop: "2rem" }}
                            onClick={handleScanAnother}
                        >
                            🔄 Scan Another Code
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ScanAttendance;
