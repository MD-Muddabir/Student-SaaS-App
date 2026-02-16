const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Subject = sequelize.define("Subject", {
    institute_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    faculty_id: DataTypes.INTEGER,
}, {
    tableName: 'subjects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Subject;
