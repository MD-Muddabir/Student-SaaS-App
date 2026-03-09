const authService = require("../services/auth.service");
const generateToken = require("../utils/generateToken");

/**
 * Register a new institute
 * Creates institute and admin user
 */
exports.register = async (req, res) => {
    try {
        const result = await authService.registerInstitute(req.body);

        // TODO: Send welcome email (emailService not configured yet)
        // const emailService = require("../services/email.service");
        // await emailService.sendEmail(...)

        res.status(201).json({
            success: true,
            message: "Institute registered successfully",
            data: {
                instituteName: result.institute.name,
                email: result.institute.email,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Registration failed"
        });
    }
};

/**
 * Public Institute Registration
 * Creates institute with pending status and admin user
 */
exports.registerInstitute = async (req, res) => {
    try {
        const { name, email, password, phone, address, city, state, pincode, plan_id } = req.body;

        // Validation
        if (!name || !email || !password || !phone || !plan_id) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Password validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        // Phone validation
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }

        const result = await authService.registerInstitute({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            phone: phone.replace(/\s/g, ""),
            address: address?.trim(),
            city: city?.trim(),
            state: state?.trim(),
            pincode: pincode?.trim(),
            plan_id,
            status: "pending" // Institute starts as pending until payment
        });

        const token = generateToken(result.adminUser);

        res.status(201).json({
            success: true,
            message: "Registration successful! Please complete payment to activate your account.",
            token,
            user: {
                id: result.adminUser.id,
                name: result.adminUser.name,
                email: result.adminUser.email,
                role: result.adminUser.role,
                institute_id: result.institute.id,
                institute_name: result.institute.name
            },
            data: {
                institute_id: result.institute.id,
                email: result.institute.email,
                name: result.institute.name
            }
        });
    } catch (error) {
        console.error("Public registration error:", error);

        // Handle duplicate email
        if (error.message && error.message.includes("email")) {
            return res.status(400).json({
                success: false,
                message: "This email is already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Registration failed"
        });
    }
};

/**
 * Login user
 * Returns JWT token and user info
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await authService.loginUser(email, password);
        const token = generateToken(user);

        let features = {};
        if (user.Institute && user.Institute.Plan) {
            const plan = user.Institute.Plan;
            features = {
                attendance: user.Institute.current_feature_attendance !== 'none' ? user.Institute.current_feature_attendance : plan.feature_attendance,
                auto_attendance: user.Institute.current_feature_auto_attendance !== null ? user.Institute.current_feature_auto_attendance : plan.feature_auto_attendance,
                fees: user.Institute.current_feature_fees !== null ? user.Institute.current_feature_fees : plan.feature_fees,
                reports: user.Institute.current_feature_reports || plan.feature_reports,
                announcements: user.Institute.current_feature_announcements !== null ? user.Institute.current_feature_announcements : plan.feature_announcements,
                timetable: user.Institute.current_feature_timetable !== undefined && user.Institute.current_feature_timetable !== null ? user.Institute.current_feature_timetable : plan.feature_timetable,
            };
        }

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                institute_id: user.institute_id,
                institute_name: user.Institute?.name,
                features,
                permissions: user.permissions || [],
                theme_dark: user.theme_dark ?? false,
                theme_style: user.theme_style ?? "simple",
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(401).json({
            success: false,
            message: error.message || "Login failed"
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        await authService.changePassword(userId, oldPassword, newPassword);

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.logout = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await authService.getProfile(req.user.id);
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await authService.updateProfile(req.user.id, { name, email });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Save Theme Preference
 * Stores dark/style choice per user in the database
 */
exports.saveTheme = async (req, res) => {
    try {
        const { theme_dark, theme_style } = req.body;
        const User = require("../models/user");
        await User.update(
            {
                ...(theme_dark !== undefined && { theme_dark }),
                ...(theme_style !== undefined && { theme_style }),
            },
            { where: { id: req.user.id } }
        );
        res.json({ success: true, message: "Theme saved" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
