/**
 * Main Application Component
 * Handles routing, authentication, and global state management
 */

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import MobileShell from "mobile-shell";
import WebAppRoutes from "./routes/WebAppRoutes";
import NetworkStatus from "./components/NetworkStatus";
import "./styles/global.css";
import "./styles/responsive.css";       // Always-on responsive design (media queries)
import "./themes/pro/pro-theme.css";   // Pro theme — activated by html.theme-pro
import "./styles/public-theme-overrides.css"; // Public theme fixes
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { initCapacitor } from "./utils/capacitorInit";
import { Capacitor } from "@capacitor/core";

/** Build-time constant so Vite drops WebAppRoutes for native shells (student/parent/faculty). */
const isMobileShell = Boolean(
  import.meta.env.VITE_APP_VARIANT &&
    String(import.meta.env.VITE_APP_VARIANT).toLowerCase() !== "web"
);

/** App type from env: 'student' | 'parent' | 'faculty' | 'web' */
const APP_TYPE = String(import.meta.env.VITE_APP_VARIANT || "web").toLowerCase();

function App() {
    useEffect(() => {
        initCapacitor();
    }, []);

    // ── Phase 1: Load mobile CSS conditionally ──────────────────────────
    // Load only when running as native platform OR as a mobile shell variant
    useEffect(() => {
        const isNative = Capacitor.isNativePlatform();
        const isMobileVariant = isMobileShell;

        if (isNative || isMobileVariant) {
            // Phase 1: Always load mobile base
            import("./styles/mobile-base.css").catch(() => {});

            // Phase 1: Load dashboard-specific CSS
            if (APP_TYPE === "student") {
                import("./styles/student-mobile.css").catch(() => {});
            } else if (APP_TYPE === "parent") {
                import("./styles/parent-mobile.css").catch(() => {});
            } else if (APP_TYPE === "faculty") {
                import("./styles/faculty-mobile.css").catch(() => {});
            }

            // Phase 5: Add mobile class to html for CSS targeting
            document.documentElement.classList.add("mobile-app");
            document.documentElement.classList.add(`app-${APP_TYPE}`);

            // Phase 3: Prevent double-tap zoom on mobile
            document.documentElement.style.touchAction = "manipulation";

            // Phase 4: Disable text selection globally (mobile UX)
            document.documentElement.style.webkitUserSelect = "none";
            document.documentElement.style.userSelect = "none";
        }
    }, []);

    return (
        <BrowserRouter>
            <AuthProvider>
                {/* ThemeProvider must be INSIDE AuthProvider so it can read user */}
                <ThemeProvider>
                    <NetworkStatus />
                    <Toaster position="top-right" />
                    {isMobileShell ? <MobileShell /> : <WebAppRoutes />}
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
