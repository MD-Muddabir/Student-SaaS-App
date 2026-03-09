const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Timetable = sequelize.define("Timetable", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    class_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    slot_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    day_of_week: {
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
        allowNull: false,
    },
    room_number: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    tableName: "timetables",
    timestamps: true,
});

module.exports = Timetable;
