/**
 * Application Routes
 * Defines all routes with role-based access control
 * Implements lazy loading for performance optimization
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";
import LoadingSpinner from "../components/common/LoadingSpinner";

// Lazy load pages for code splitting
// Public Pages
const Home = lazy(() => import("../pages/public/Home"));
const Pricing = lazy(() => import("../pages/public/PricingPage")); // Updated to PricingPage
const Contact = lazy(() => import("../pages/public/ContactPage")); // Added Contact
const PaymentAndCheckout = lazy(() => import("../pages/public/PaymentPage")); // Added Payment
const Terms = lazy(() => import("../pages/public/TermsPage")); // Added Terms
const Privacy = lazy(() => import("../pages/public/PrivacyPage")); // Added Privacy

// Auth Pages
const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/public/RegisterPage")); // Use Public Register Page
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import("../pages/superadmin/Dashboard"));
const Institutes = lazy(() => import("../pages/superadmin/Institutes"));
const Plans = lazy(() => import("../pages/superadmin/Plans"));
const Subscriptions = lazy(() => import("../pages/superadmin/Subscriptions"));
const Analytics = lazy(() => import("../pages/superadmin/Analytics"));
const Revenue = lazy(() => import("../pages/superadmin/Revenue"));
const SuperAdminSettings = lazy(() => import("../pages/superadmin/Settings"));
const SuperAdminExpenses = lazy(() => import("../pages/superadmin/Expenses"));

// Admin Pages
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const Students = lazy(() => import("../pages/admin/Students"));
const Faculty = lazy(() => import("../pages/admin/Faculty"));
const Classes = lazy(() => import("../pages/admin/Classes"));
const Subjects = lazy(() => import("../pages/admin/Subjects"));
const Attendance = lazy(() => import("../pages/admin/Attendance"));
const Reports = lazy(() => import("../pages/admin/Reports"));
const Fees = lazy(() => import("../pages/admin/Fees"));
const Announcements = lazy(() => import("../pages/admin/Announcements"));
const Exams = lazy(() => import("../pages/admin/Exams"));
const Settings = lazy(() => import("../pages/admin/Settings"));
const Profile = lazy(() => import("../pages/admin/Profile"));
const Parents = lazy(() => import("../pages/admin/Parents"));
const AdminNotes = lazy(() => import("../pages/admin/AdminNotes")); // Added Admin Notes
const ManageAdmins = lazy(() => import("../pages/admin/ManageAdmins")); // Added ManageAdmins
const AdminSmartAttendance = lazy(() => import("../pages/admin/SmartAttendance"));
const AdminExpenses = lazy(() => import("../pages/admin/Expenses"));
const AdminTimetable = lazy(() => import("../pages/admin/Timetable"));
const AdminFacultyAttendance = lazy(() => import("../pages/admin/FacultyAttendance")); // Added FacultyAttendance Scanner
const AdminFacultyViewAttendance = lazy(() => import("../pages/admin/AdminFacultyViewAttendance"));
const AdminManageFacultyAttendance = lazy(() => import("../pages/admin/AdminManageFacultyAttendance"));
const AdminBiometric = lazy(() => import("../pages/admin/Biometric"));
const FacultyViewAttendance = lazy(() => import("../pages/faculty/ViewAttendance"));
// Faculty Pages
const FacultyDashboard = lazy(() => import("../pages/faculty/Dashboard"));
const MarkAttendance = lazy(() => import("../pages/faculty/MarkAttendance"));
const EnterMarks = lazy(() => import("../pages/faculty/EnterMarks"));
const ViewStudents = lazy(() => import("../pages/faculty/ViewStudents"));
const FacultySmartAttendance = lazy(() => import("../pages/admin/SmartAttendance")); // Reuse admin page
const FacultyAnnouncements = lazy(() => import("../pages/faculty/Announcements")); // Added Announcements
const FacultySchedule = lazy(() => import("../pages/faculty/MySchedule")); // Added Timetable
const ScanFacultyQR = lazy(() => import("../pages/faculty/ScanFacultyQR")); // Added ScanFacultyQR
const FacultyNotes = lazy(() => import("../pages/faculty/FacultyNotes")); // Added Notes
const ChatApp = lazy(() => import("../pages/chat/ChatApp")); // Added Chat

// Student Pages
const StudentDashboard = lazy(() => import("../pages/student/Dashboard"));
const ViewAttendance = lazy(() => import("../pages/student/ViewAttendance"));
const ViewMarks = lazy(() => import("../pages/student/ViewMarks"));
const ViewAnnouncements = lazy(() => import("../pages/student/ViewAnnouncements"));
const PayFees = lazy(() => import("../pages/student/PayFees"));
const ScanAttendance = lazy(() => import("../pages/student/ScanAttendance"));
const StudentTimetable = lazy(() => import("../pages/student/Timetable")); // Added Timetable
const StudentNotes = lazy(() => import("../pages/student/StudentNotes")); // Added Notes

// Parent Pages
const ParentDashboard = lazy(() => import("../pages/parent/Dashboard"));
const ParentTimetable = lazy(() => import("../pages/parent/Timetable"));

// Common Pages
const NotFound = lazy(() => import("../pages/common/NotFound"));
const Unauthorized = lazy(() => import("../pages/common/Unauthorized"));

/**
 * Loading fallback component
 */
const PageLoader = () => (
  <div className="page-loader">
    <LoadingSpinner />
  </div>
);

/**
 * Main routing configuration
 */
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/renew-plan" element={<Pricing />} /> {/* Renewal Flow */}
        <Route path="/checkout" element={<PaymentAndCheckout />} /> {/* Payment Flow */}
        <Route path="/features" element={<Home />} />
        <Route path="/about" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Super Admin Routes */}
        <Route
          path="/superadmin/*"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <Routes>
                <Route path="dashboard" element={<SuperAdminDashboard />} />
                <Route path="institutes" element={<Institutes />} />
                <Route path="plans" element={<Plans />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="revenue" element={<Revenue />} />
                <Route path="expenses" element={<SuperAdminExpenses />} />
                <Route path="settings" element={<SuperAdminSettings />} />
                <Route path="*" element={<Navigate to="/superadmin/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Admin/Manager Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin", "manager"]}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="admins" element={<ManageAdmins />} />
                <Route path="parents" element={<Parents />} />
                <Route path="students" element={<Students />} />
                <Route path="faculty" element={<Faculty />} />
                <Route path="classes" element={<Classes />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="faculty-attendance" element={<AdminManageFacultyAttendance />} />
                <Route path="scan-faculty-qr" element={<AdminFacultyAttendance />} />
                <Route path="view-faculty-attendance" element={<AdminFacultyViewAttendance />} />
                <Route path="view-attendance" element={<FacultyViewAttendance />} />
                <Route path="smart-attendance" element={<AdminSmartAttendance />} />
                <Route path="reports" element={<Reports />} />
                <Route path="fees" element={<Fees />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="exams" element={<Exams />} />
                <Route path="timetable" element={<AdminTimetable />} />
                <Route path="expenses" element={<AdminExpenses />} />
                <Route path="settings" element={<Settings />} />
                <Route path="notes" element={<AdminNotes />} />
                <Route path="biometric" element={<AdminBiometric />} />
                <Route path="chat-monitor" element={<ChatApp />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="/faculty/*"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <Routes>
                <Route path="dashboard" element={<FacultyDashboard />} />
                <Route path="attendance" element={<MarkAttendance />} />
                <Route path="view-attendance" element={<FacultyViewAttendance />} />
                <Route path="smart-attendance" element={<FacultySmartAttendance />} />
                <Route path="scan-attendance" element={<ScanFacultyQR />} />
                <Route path="marks" element={<EnterMarks />} />
                <Route path="students" element={<ViewStudents />} />
                <Route path="announcements" element={<FacultyAnnouncements />} />
                <Route path="timetable" element={<FacultySchedule />} />
                <Route path="notes" element={<FacultyNotes />} />
                <Route path="chat" element={<ChatApp />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/faculty/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="attendance" element={<ViewAttendance />} />
                <Route path="scan-attendance" element={<ScanAttendance />} />
                <Route path="exams" element={<ViewMarks />} />
                <Route path="announcements" element={<ViewAnnouncements />} />
                <Route path="fees" element={<PayFees />} />
                <Route path="buy-plan" element={<Pricing />} />
                <Route path="timetable" element={<StudentTimetable />} />
                <Route path="notes" element={<StudentNotes />} />
                <Route path="chat" element={<ChatApp />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/student/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Parent Routes */}
        <Route
          path="/parent/*"
          element={
            <ProtectedRoute allowedRoles={["parent"]}>
              <Routes>
                <Route path="dashboard" element={<ParentDashboard />} />
                <Route path="timetable" element={<ParentTimetable />} />
                <Route path="chat" element={<ChatApp />} />
                <Route path="profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/parent/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Default Route - Redirect based on role */}


        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
