/**
 * Plan Model
 * Defines subscription plans with limits and features
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Plan = sequelize.define("Plan", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    // Limits
    max_students: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100
    },
    max_faculty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
    },
    max_classes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
    },
    max_admin_users: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },

    // Core Features (Always Available)
    feature_students: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    feature_faculty: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    feature_classes: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    feature_subjects: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },

    // Advanced Features
    feature_attendance: {
        type: DataTypes.ENUM('none', 'basic', 'advanced'),
        defaultValue: 'basic'
    },
    feature_auto_attendance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_fees: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_reports: {
        type: DataTypes.ENUM('none', 'basic', 'advanced'),
        defaultValue: 'none'
    },
    feature_announcements: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_exams: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_export: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_sms: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_whatsapp: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_timetable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_notes: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_chat: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // Premium Features
    feature_custom_branding: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_multi_branch: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_api_access: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_parent_portal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    feature_mobile_app: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // Plan Status
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'archived'),
        defaultValue: 'active'
    },
    is_popular: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // Razorpay Integration
    razorpay_plan_id: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'plans'
});

module.exports = Plan;
