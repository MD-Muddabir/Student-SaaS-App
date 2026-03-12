const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Institute = sequelize.define("Institute", {
    plan_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false, unique: 'unique_institute_email' },
    phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    zip_code: DataTypes.STRING,
    logo: DataTypes.STRING,
    subscription_start: DataTypes.DATEONLY,
    subscription_end: DataTypes.DATEONLY,
    status: DataTypes.ENUM("active", "expired", "suspended", "pending"),

    // Snapshot of Plan Limits (for grandfathering)
    current_limit_students: {
        type: DataTypes.INTEGER,
        defaultValue: 50 // Default Basic
    },
    current_limit_faculty: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    current_limit_classes: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    current_limit_admins: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },

    // Snapshot of Features (for grandfathering)
    current_feature_attendance: {
        type: DataTypes.ENUM('none', 'basic', 'advanced'),
        defaultValue: 'basic'
    },
    current_feature_auto_attendance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_feature_fees: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_feature_reports: {
        type: DataTypes.ENUM('none', 'basic', 'advanced'),
        defaultValue: 'none'
    },
    current_feature_announcements: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_feature_export: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_feature_timetable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_feature_whatsapp: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_feature_custom_branding: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_feature_multi_branch: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_feature_api_access: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    current_feature_public_page: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
});

module.exports = Institute;
