/**
 * Main Application Component
 * Handles routing, authentication, and global state management
 */

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppRoutes from "./routes/AppRoutes";
import NetworkStatus from "./components/NetworkStatus";
import "./styles/global.css";
import "./themes/pro/pro-theme.css";   // Pro theme — activated by html.theme-pro
import "./styles/public-theme-overrides.css"; // Public theme fixes

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                {/* ThemeProvider must be INSIDE AuthProvider so it can read user */}
                <ThemeProvider>
                    <NetworkStatus />
                    <AppRoutes />
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
