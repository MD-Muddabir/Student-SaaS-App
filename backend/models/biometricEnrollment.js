const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BiometricEnrollment = sequelize.define("BiometricEnrollment", {
    institute_id: { type: DataTypes.INTEGER, allowNull: false },
    device_id: { type: DataTypes.INTEGER, allowNull: false },
    device_user_id: { type: DataTypes.STRING(50), allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    user_role: {
        type: DataTypes.ENUM("student", "faculty"),
        allowNull: false
    },
    enrolled_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    enrolled_by: { type: DataTypes.INTEGER },
    status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active"
    },
}, {
    tableName: "biometric_enrollments",
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: "biometric_enrollment_unique",
            unique: true,
            fields: ["device_id", "device_user_id"]
        }
    ]
});

module.exports = BiometricEnrollment;
