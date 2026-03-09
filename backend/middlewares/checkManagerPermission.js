/**
 * checkManagerPermission middleware
 *
 * Usage: checkManagerPermission("students.create")
 *        checkManagerPermission("students.read", ["fees", "attendance"])  <- also allow if manager has these extra perms
 *
 * - Admins / super_admin pass automatically.
 * - Managers must have the feature key stored in user.permissions (JSON array).
 *   OR they have the base module key (e.g. 'students' grants all students.*)
 *   OR they have one of the `alsoAllowedWith` permissions listed.
 * - Faculty, students, and other roles pass through (role.middleware already handled them).
 */
const checkManagerPermission = (featureKey, alsoAllowedWith = []) => {
    return (req, res, next) => {
        const { role, permissions } = req.user;

        // Primary admin or super_admin – full access
        if (role === 'admin' || role === 'super_admin') return next();

        if (role === 'manager') {
            const perms = Array.isArray(permissions) ? permissions : [];

            // Exact match (e.g. 'students.create')
            if (perms.includes(featureKey)) return next();

            // Base module match (e.g. 'students' grants all 'students.*')
            const baseModule = featureKey.split('.')[0];
            if (perms.includes(baseModule)) return next();

            // Cross-module: allow if manager has any of the listed "also allowed with" perms
            // Example: fees perm lets manager read students for the collection screen
            if (alsoAllowedWith.some(p => perms.includes(p))) return next();

            return res.status(403).json({
                success: false,
                message: `Permission denied: Requires ${featureKey} access.`
            });
        }

        // For other roles (faculty, student) role.middleware has already authorized
        return next();
    };
};

module.exports = checkManagerPermission;
