/**
 * NetworkStatus - Beautiful offline indicator
 */

import { useState, useEffect } from "react";
import "./NetworkStatus.css";

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBackOnline, setShowBackOnline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowBackOnline(true);
            setTimeout(() => setShowBackOnline(false), 4000); // Hide success toast after 4s
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBackOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (isOnline && !showBackOnline) return null;

    return (
        <div className={`network-status-container ${!isOnline ? "offline" : "online"}`}>
            {!isOnline ? (
                <div className="network-toast offline-toast card">
                    <div className="network-icon">📡</div>
                    <div className="network-content">
                        <strong>No Internet Connection</strong>
                        <p>You're offline. Check your connection.</p>
                    </div>
                </div>
            ) : (
                <div className="network-toast online-toast card">
                    <div className="network-icon" style={{ filter: "hue-rotate(90deg)" }}>📡</div>
                    <div className="network-content">
                        <strong>Back Online</strong>
                        <p>Your connection has been restored.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkStatus;
