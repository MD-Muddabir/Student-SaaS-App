const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FacultyAttendance = sequelize.define("FacultyAttendance", {
    institute_id: DataTypes.INTEGER,
    faculty_id: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    status: DataTypes.ENUM("present", "absent", "late", "half_day", "holiday"),
    marked_by: DataTypes.INTEGER, // admin ID who marked it or self if smart QR
    remarks: DataTypes.TEXT,
}, {
    tableName: "faculty_attendances",
    timestamps: true,
    underscored: true,
    indexes: [
        {
            name: "faculty_attendance_unique_daily",
            unique: true,
            fields: ["institute_id", "faculty_id", "date"]
        }
    ]
});

module.exports = FacultyAttendance;
