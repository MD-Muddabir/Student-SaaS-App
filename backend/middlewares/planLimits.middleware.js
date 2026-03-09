/**
 * Plan Limit Enforcement Middleware
 * Checks if institute has reached limits based on their plan
 */

const { Institute, Plan, Student, User, Class } = require("../models");
const { Op } = require("sequelize");

/**
 * Check if institute can add more students
 */
const checkStudentLimit = async (req, res, next) => {
    try {
        const institute_id = req.user.institute_id;

        // Get institute with plan
        const institute = await Institute.findByPk(institute_id, {
            include: [{ model: Plan }]
        });

        if (!institute || !institute.Plan) {
            return res.status(400).json({
                success: false,
                message: "Institute or plan not found"
            });
        }

        // Count current students
        const studentCount = await Student.count({
            where: { institute_id }
        });

        // Determine limit (Snapshot first, then Plan fallback)
        const limit_students = institute.current_limit_students || institute.Plan.max_students;

        if (studentCount >= limit_students) {
            return res.status(403).json({
                success: false,
                message: `Student limit reached! Your plan allows up to ${limit_students} students. Please upgrade your plan.`,
                limit_reached: true,
                current_count: studentCount,
                max_limit: limit_students,
                upgrade_required: true
            });
        }

        next();
    } catch (error) {
        console.error("Error checking student limit:", error);
        res.status(500).json({
            success: false,
            message: "Error checking student limit"
        });
    }
};

/**
 * Check if institute can add more faculty
 */
const checkFacultyLimit = async (req, res, next) => {
    try {
        const institute_id = req.user.institute_id;

        const institute = await Institute.findByPk(institute_id, {
            include: [{ model: Plan }]
        });

        if (!institute || !institute.Plan) {
            return res.status(400).json({
                success: false,
                message: "Institute or plan not found"
            });
        }

        // Count current faculty
        const facultyCount = await User.count({
            where: {
                institute_id,
                role: 'faculty'
            }
        });

        const limit_faculty = institute.current_limit_faculty || institute.Plan.max_faculty;

        if (facultyCount >= limit_faculty) {
            return res.status(403).json({
                success: false,
                message: `Faculty limit reached! Your plan allows up to ${limit_faculty} faculty members. Please upgrade your plan.`,
                limit_reached: true,
                current_count: facultyCount,
                max_limit: limit_faculty,
                upgrade_required: true
            });
        }

        next();
    } catch (error) {
        console.error("Error checking faculty limit:", error);
        res.status(500).json({
            success: false,
            message: "Error checking faculty limit"
        });
    }
};

/**
 * Check if institute can add more classes
 */
const checkClassLimit = async (req, res, next) => {
    try {
        const institute_id = req.user.institute_id;

        const institute = await Institute.findByPk(institute_id, {
            include: [{ model: Plan }]
        });

        if (!institute || !institute.Plan) {
            return res.status(400).json({
                success: false,
                message: "Institute or plan not found"
            });
        }

        // Count current classes
        const classCount = await Class.count({
            where: { institute_id }
        });

        const limit_classes = institute.current_limit_classes || institute.Plan.max_classes;

        if (classCount >= limit_classes) {
            return res.status(403).json({
                success: false,
                message: `Class limit reached! Your plan allows up to ${limit_classes} classes. Please upgrade your plan.`,
                limit_reached: true,
                current_count: classCount,
                max_limit: limit_classes,
                upgrade_required: true
            });
        }

        next();
    } catch (error) {
        console.error("Error checking class limit:", error);
        res.status(500).json({
            success: false,
            message: "Error checking class limit"
        });
    }
};

/**
 * Check if institute can add more admin users
 */
const checkAdminUserLimit = async (req, res, next) => {
    try {
        const institute_id = req.user.institute_id;

        const institute = await Institute.findByPk(institute_id, {
            include: [{ model: Plan }]
        });

        if (!institute || !institute.Plan) {
            return res.status(400).json({
                success: false,
                message: "Institute or plan not found"
            });
        }

        // Count current admin users
        const adminCount = await User.count({
            where: {
                institute_id,
                role: 'admin'
            }
        });

        const limit_admins = institute.current_limit_admins || institute.Plan.max_admin_users;

        if (adminCount >= limit_admins) {
            return res.status(403).json({
                success: false,
                message: `Admin user limit reached! Your plan allows up to ${limit_admins} admin users. Please upgrade your plan.`,
                limit_reached: true,
                current_count: adminCount,
                max_limit: limit_admins,
                upgrade_required: true
            });
        }

        next();
    } catch (error) {
        console.error("Error checking admin user limit:", error);
        res.status(500).json({
            success: false,
            message: "Error checking admin user limit"
        });
    }
};

/**
 * Check if institute has access to a feature
 */
const checkFeatureAccess = (featureName) => {
    return async (req, res, next) => {
        try {
            const institute_id = req.user.institute_id;

            const institute = await Institute.findByPk(institute_id, {
                include: [{ model: Plan }]
            });

            if (!institute || !institute.Plan) {
                return res.status(400).json({
                    success: false,
                    message: "Institute or plan not found"
                });
            }

            const plan = institute.Plan;

            // Determine feature access (Snapshot first, then Plan fallback)
            const features = {
                attendance: institute.current_feature_attendance !== 'none' ? institute.current_feature_attendance : plan.feature_attendance,
                auto_attendance: institute.current_feature_auto_attendance !== null ? institute.current_feature_auto_attendance : plan.feature_auto_attendance,
                fees: institute.current_feature_fees !== null ? institute.current_feature_fees : plan.feature_fees,
                reports: institute.current_feature_reports || plan.feature_reports,
                announcements: institute.current_feature_announcements !== null ? institute.current_feature_announcements : plan.feature_announcements,
                export: institute.current_feature_export !== null ? institute.current_feature_export : plan.feature_export,
                whatsapp: institute.current_feature_whatsapp !== null ? institute.current_feature_whatsapp : plan.feature_whatsapp,
                custom_branding: institute.current_feature_custom_branding !== null ? institute.current_feature_custom_branding : plan.feature_custom_branding,
                multi_branch: institute.current_feature_multi_branch !== null ? institute.current_feature_multi_branch : plan.feature_multi_branch,
                api_access: institute.current_feature_api_access !== null ? institute.current_feature_api_access : plan.feature_api_access,
                timetable: institute.current_feature_timetable !== undefined && institute.current_feature_timetable !== null ? institute.current_feature_timetable : plan.feature_timetable,
            };

            // Check if feature is enabled
            let hasAccess = false;

            switch (featureName) {
                case 'attendance':
                    hasAccess = features.attendance !== 'none';
                    break;
                case 'auto_attendance':
                    hasAccess = features.auto_attendance === true;
                    break;
                case 'fees':
                    hasAccess = features.fees === true;
                    break;
                case 'reports':
                    hasAccess = features.reports !== 'none';
                    break;
                case 'timetable':
                    hasAccess = features.timetable === true;
                    break;
                case 'announcements':
                    hasAccess = features.announcements === true;
                    break;
                case 'export':
                    hasAccess = features.export === true;
                    break;
                case 'whatsapp':
                    hasAccess = features.whatsapp === true;
                    break;
                case 'custom_branding':
                    hasAccess = features.custom_branding === true;
                    break;
                case 'multi_branch':
                    hasAccess = features.multi_branch === true;
                    break;
                case 'api_access':
                    hasAccess = features.api_access === true;
                    break;
                default:
                    hasAccess = true; // Unknown features are allowed by default
            }

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: `This feature is not available in your ${plan.name} plan. Please upgrade to access ${featureName}.`,
                    feature_locked: true,
                    current_plan: plan.name,
                    upgrade_required: true
                });
            }

            next();
        } catch (error) {
            console.error("Error checking feature access:", error);
            res.status(500).json({
                success: false,
                message: "Error checking feature access"
            });
        }
    };
};

/**
 * Get current usage and limits for institute
 */
const getUsageStats = async (req, res) => {
    try {
        const institute_id = req.user.institute_id;

        const institute = await Institute.findByPk(institute_id, {
            include: [{ model: Plan }]
        });

        if (!institute || !institute.Plan) {
            return res.status(400).json({
                success: false,
                message: "Institute or plan not found"
            });
        }

        // Get current counts
        const [studentCount, facultyCount, classCount, adminCount] = await Promise.all([
            Student.count({ where: { institute_id } }),
            User.count({ where: { institute_id, role: 'faculty' } }),
            Class.count({ where: { institute_id } }),
            User.count({ where: { institute_id, role: 'admin' } })
        ]);

        // Determine limits (Snapshot first, then Plan fallback)
        const limit_students = institute.current_limit_students || institute.Plan.max_students;
        const limit_faculty = institute.current_limit_faculty || institute.Plan.max_faculty;
        const limit_classes = institute.current_limit_classes || institute.Plan.max_classes;
        const limit_admins = institute.current_limit_admins || institute.Plan.max_admin_users;

        res.json({
            success: true,
            data: {
                plan: {
                    name: institute.Plan.name,
                    price: institute.Plan.price
                },
                usage: {
                    students: {
                        current: studentCount,
                        limit: limit_students,
                        percentage: Math.round((studentCount / limit_students) * 100),
                        remaining: Math.max(0, limit_students - studentCount)
                    },
                    faculty: {
                        current: facultyCount,
                        limit: limit_faculty,
                        percentage: Math.round((facultyCount / limit_faculty) * 100),
                        remaining: Math.max(0, limit_faculty - facultyCount)
                    },
                    classes: {
                        current: classCount,
                        limit: limit_classes,
                        percentage: Math.round((classCount / limit_classes) * 100),
                        remaining: Math.max(0, limit_classes - classCount)
                    },
                    admin_users: {
                        current: adminCount,
                        limit: limit_admins,
                        percentage: Math.round((adminCount / limit_admins) * 100),
                        remaining: Math.max(0, limit_admins - adminCount)
                    }
                },
                features: {
                    attendance: institute.current_feature_attendance !== 'none' ? institute.current_feature_attendance : institute.Plan.feature_attendance,
                    auto_attendance: institute.current_feature_auto_attendance !== null ? institute.current_feature_auto_attendance : institute.Plan.feature_auto_attendance,
                    fees: institute.current_feature_fees !== null ? institute.current_feature_fees : institute.Plan.feature_fees,
                    reports: institute.current_feature_reports || institute.Plan.feature_reports,
                    announcements: institute.current_feature_announcements !== null ? institute.current_feature_announcements : institute.Plan.feature_announcements,
                    export: institute.current_feature_export !== null ? institute.current_feature_export : institute.Plan.feature_export,
                    whatsapp: institute.current_feature_whatsapp !== null ? institute.current_feature_whatsapp : institute.Plan.feature_whatsapp,
                    timetable: institute.current_feature_timetable !== undefined && institute.current_feature_timetable !== null ? institute.current_feature_timetable : institute.Plan.feature_timetable,
                    custom_branding: institute.current_feature_custom_branding !== null ? institute.current_feature_custom_branding : institute.Plan.feature_custom_branding,
                    multi_branch: institute.current_feature_multi_branch !== null ? institute.current_feature_multi_branch : institute.Plan.feature_multi_branch
                }
            }
        });
    } catch (error) {
        console.error("Error getting usage stats:", error);
        res.status(500).json({
            success: false,
            message: "Error getting usage stats"
        });
    }
};

module.exports = {
    checkStudentLimit,
    checkFacultyLimit,
    checkClassLimit,
    checkAdminUserLimit,
    checkFeatureAccess,
    getUsageStats
};
